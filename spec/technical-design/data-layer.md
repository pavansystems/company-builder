# Company Builder — Data Layer Technical Design

## Overview

The Company Builder platform is powered by a Supabase-based data layer that underpins every agent, service, and UI component. Supabase provides Postgres, Realtime, Edge Functions, Auth, and Storage — offering a complete backend-as-a-service foundation without vendor lock-in.

The data layer serves three critical functions:

1. **Persistence.** All pipeline state, intermediate outputs, scoring data, and human decisions are durably stored.
2. **Concurrency & Consistency.** Multiple agents and services operate in parallel; the database enforces correctness through schemas, RLS, and transactions.
3. **Observability & Audit.** Every agent run, gate decision, and state change is logged for debugging, learning, and compliance.

The UI (Next.js on Vercel) reads from and writes to the database, while a fleet of agents (running as scheduled tasks, Edge Functions, or external services) consume and produce pipeline data. Cloudflare sits in front as a CDN and edge routing layer.

---

## 1. Database Schema Design

The schema is organized into logical groups:

- **Content ingestion** (`sources`, `content_items`)
- **Signal detection & classification** (`signals`, `market_opportunities`, `opportunity_scores`)
- **Watchlist** (`watchlist_versions`, `watchlist_items`)
- **Ideation** (`concepts`, `concept_scores`)
- **Validation** (`validations`)
- **Blueprints** (`blueprints`)
- **Pipeline orchestration** (`pipeline_items`, `gate_decisions`, `agent_runs`)
- **User annotations & feedback** (`user_annotations`, `feedback_events`)

### 1.1 Content Ingestion Layer

#### `sources`

Configuration of external content sources for Phase 0 scanning.

```sql
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  source_type VARCHAR(50) NOT NULL, -- 'rss', 'api', 'webpage', 'research_db'
  url TEXT,
  api_key TEXT, -- encrypted at rest, only accessible via service role
  config JSONB, -- source-specific config (feed URLs, API endpoints, auth params)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT source_type_valid CHECK (source_type IN ('rss', 'api', 'webpage', 'research_db'))
);

CREATE INDEX idx_sources_active ON sources(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_sources_type ON sources(source_type);
```

#### `content_items`

Normalized ingested content from all sources.

```sql
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  external_id VARCHAR(512), -- unique ID from source (for deduplication)
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  ingested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  content_hash VARCHAR(64), -- SHA256 hash for deduplication
  metadata JSONB, -- source-specific metadata (author, tags, categories, etc.)
  is_duplicate BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,

  UNIQUE(source_id, external_id),
  CONSTRAINT url_or_body CHECK (url IS NOT NULL OR body IS NOT NULL)
);

CREATE INDEX idx_content_items_source ON content_items(source_id);
CREATE INDEX idx_content_items_published ON content_items(published_at DESC);
CREATE INDEX idx_content_items_ingested ON content_items(ingested_at DESC);
CREATE INDEX idx_content_items_hash ON content_items(content_hash);
CREATE INDEX idx_content_items_archived ON content_items(is_archived) WHERE is_archived = FALSE;
```

---

### 1.2 Signal Detection & Market Classification

#### `signals`

Detected signals within ingested content (Phase 0.2).

```sql
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  signal_type VARCHAR(50) NOT NULL, -- 'tech_breakthrough', 'regulatory_shift', 'market_event', 'customer_pain'
  summary TEXT NOT NULL,
  confidence NUMERIC(3,2), -- 0.0 to 1.0
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  detected_by VARCHAR(255), -- agent name
  entities JSONB, -- extracted entities: {companies: [], technologies: [], trends: []}
  impact_rating VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  is_archived BOOLEAN DEFAULT FALSE,

  CONSTRAINT signal_type_valid CHECK (signal_type IN ('tech_breakthrough', 'regulatory_shift', 'market_event', 'customer_pain')),
  CONSTRAINT confidence_range CHECK (confidence >= 0.0 AND confidence <= 1.0)
);

CREATE INDEX idx_signals_type ON signals(signal_type);
CREATE INDEX idx_signals_detected ON signals(detected_at DESC);
CREATE INDEX idx_signals_confidence ON signals(confidence DESC);
CREATE INDEX idx_signals_archived ON signals(is_archived) WHERE is_archived = FALSE;
```

#### `market_opportunities`

Market opportunity candidates identified by mapping signals to markets (Phase 0.3).

```sql
CREATE TABLE market_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(512) NOT NULL,
  description TEXT,
  target_market VARCHAR(255),
  target_industry VARCHAR(255),
  problem_statement TEXT,
  enabling_signals JSONB, -- array of signal IDs that triggered this opportunity
  agent_readiness_tag VARCHAR(50), -- 'high', 'medium', 'low'
  market_size_estimate BIGINT, -- estimated TAM in USD
  market_size_confidence NUMERIC(3,2),
  competitive_density VARCHAR(50), -- 'crowded', 'moderate', 'sparse'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ranked_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  archived_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT agent_readiness_valid CHECK (agent_readiness_tag IN ('high', 'medium', 'low')),
  CONSTRAINT competitive_density_valid CHECK (competitive_density IN ('crowded', 'moderate', 'sparse'))
);

CREATE INDEX idx_market_opp_active ON market_opportunities(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_market_opp_ranked ON market_opportunities(ranked_at DESC);
CREATE INDEX idx_market_opp_industry ON market_opportunities(target_industry);
```

#### `opportunity_scores`

Multi-dimensional scoring for market opportunities (Phase 0.4).

```sql
CREATE TABLE opportunity_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_opportunity_id UUID NOT NULL REFERENCES market_opportunities(id) ON DELETE CASCADE,
  scored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scored_by VARCHAR(255), -- agent name

  -- Dimension scores (0.0–1.0)
  market_size_score NUMERIC(3,2),
  signal_convergence_score NUMERIC(3,2), -- strength of multiple signals
  agent_readiness_score NUMERIC(3,2),
  competitive_density_score NUMERIC(3,2), -- inverse: lower density = higher score
  timing_confidence_score NUMERIC(3,2),

  -- Composite
  composite_score NUMERIC(3,2), -- weighted average of above

  -- Weights (must sum to 1.0)
  weight_market_size NUMERIC(3,2) DEFAULT 0.25,
  weight_signal_convergence NUMERIC(3,2) DEFAULT 0.25,
  weight_agent_readiness NUMERIC(3,2) DEFAULT 0.20,
  weight_competitive_density NUMERIC(3,2) DEFAULT 0.15,
  weight_timing_confidence NUMERIC(3,2) DEFAULT 0.15,

  reasoning TEXT -- why this score was assigned
);

CREATE INDEX idx_opp_scores_composite ON opportunity_scores(composite_score DESC);
CREATE INDEX idx_opp_scores_market_opp ON opportunity_scores(market_opportunity_id);
CREATE INDEX idx_opp_scores_scored_at ON opportunity_scores(scored_at DESC);
```

---

### 1.3 Watchlist & Concepts

#### `watchlist_versions`

Versioned snapshots of the ranked watchlist (Phase 0.5).

```sql
CREATE TABLE watchlist_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number INT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  snapshot_data JSONB, -- array of {id, title, score, rank, ...}
  total_opportunities INT,
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(version_number)
);

CREATE INDEX idx_watchlist_versions_published ON watchlist_versions(published_at DESC);
```

#### `concepts`

Startup concept sketches generated from market opportunities (Phase 1.3).

```sql
CREATE TABLE concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_opportunity_id UUID NOT NULL REFERENCES market_opportunities(id),
  title VARCHAR(512) NOT NULL,
  summary TEXT,

  -- Core concept definition
  value_proposition TEXT,
  target_customer_segment TEXT,
  pain_points_addressed JSONB, -- array of pain point descriptions
  agent_architecture_sketch TEXT,
  defensibility_notes TEXT,

  -- Metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by VARCHAR(255), -- agent name
  source_phase VARCHAR(50), -- 'generated' or 'user_provided'

  is_active BOOLEAN DEFAULT TRUE,
  selected_for_validation BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_concepts_market_opp ON concepts(market_opportunity_id);
CREATE INDEX idx_concepts_active ON concepts(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_concepts_selected ON concepts(selected_for_validation) WHERE selected_for_validation = TRUE;
```

#### `concept_scores`

Multi-dimensional scoring for concepts (Phase 1.4).

```sql
CREATE TABLE concept_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  scored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scored_by VARCHAR(255), -- agent name

  -- Dimension scores (0.0–1.0)
  disruption_potential NUMERIC(3,2),
  agent_readiness NUMERIC(3,2),
  feasibility NUMERIC(3,2),
  differentiation NUMERIC(3,2),
  revenue_clarity NUMERIC(3,2),

  -- Composite
  composite_score NUMERIC(3,2),

  -- Weights
  weight_disruption NUMERIC(3,2) DEFAULT 0.25,
  weight_agent_readiness NUMERIC(3,2) DEFAULT 0.25,
  weight_feasibility NUMERIC(3,2) DEFAULT 0.20,
  weight_differentiation NUMERIC(3,2) DEFAULT 0.15,
  weight_revenue_clarity NUMERIC(3,2) DEFAULT 0.15,

  reasoning TEXT
);

CREATE INDEX idx_concept_scores_composite ON concept_scores(composite_score DESC);
CREATE INDEX idx_concept_scores_concept ON concept_scores(concept_id);
```

---

### 1.4 Validation Results

#### `validations`

Phase 2 validation reports covering market, competition, customer, feasibility, and economics (Phase 2.1–2.5).

```sql
CREATE TABLE validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  validation_phase VARCHAR(50), -- 'market_sizing', 'competitive', 'customer', 'feasibility', 'economics'

  -- Market Sizing (Phase 2.1)
  tam_estimate BIGINT, -- Total Addressable Market (USD)
  tam_confidence NUMERIC(3,2),
  sam_estimate BIGINT, -- Serviceable Addressable Market (USD)
  som_estimate BIGINT, -- Serviceable Obtainable Market (USD)
  growth_rate_percent NUMERIC(5,2),
  market_sizing_methodology TEXT,

  -- Competitive Analysis (Phase 2.2)
  competitors JSONB, -- array of {name, pricing, weaknesses, market_share}
  vulnerability_map JSONB, -- cost/speed advantages vs. incumbents
  competitive_intensity VARCHAR(50), -- 'low', 'moderate', 'high'

  -- Customer Validation (Phase 2.3)
  pain_point_evidence JSONB, -- array of {pain_point, search_volume, sentiment, willingness_to_pay}
  early_adopter_profile TEXT,
  willingness_to_pay_low BIGINT,
  willingness_to_pay_high BIGINT,
  customer_validation_confidence NUMERIC(3,2),

  -- Feasibility Assessment (Phase 2.4)
  required_ai_capabilities JSONB, -- array of required capabilities
  technical_risks JSONB, -- array of {risk, severity, known_solution}
  regulatory_barriers TEXT,
  showstoppers JSONB, -- array of blockers
  feasibility_rating VARCHAR(50), -- 'viable', 'challenging', 'not_viable'

  -- Unit Economics (Phase 2.5)
  cac BIGINT, -- Customer Acquisition Cost (USD)
  ltv BIGINT, -- Lifetime Value (USD)
  ltv_cac_ratio NUMERIC(5,2),
  gross_margin_percent NUMERIC(5,2),
  breakeven_months INT,
  unit_economics_json JSONB, -- full model snapshot

  -- Synthesis & Verdict (Phase 2.6)
  verdict VARCHAR(50), -- 'go', 'go_with_caution', 'no_go'
  confidence NUMERIC(3,2), -- 0.0–1.0
  summary TEXT,
  key_assumptions JSONB, -- array of critical assumptions
  risks JSONB, -- array of {risk, severity, mitigation}

  -- Metadata
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_by VARCHAR(255), -- agent name
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT validation_phase_valid CHECK (validation_phase IN ('market_sizing', 'competitive', 'customer', 'feasibility', 'economics', 'synthesis')),
  CONSTRAINT verdict_valid CHECK (verdict IN ('go', 'go_with_caution', 'no_go'))
);

CREATE INDEX idx_validations_concept ON validations(concept_id);
CREATE INDEX idx_validations_phase ON validations(validation_phase);
CREATE INDEX idx_validations_verdict ON validations(verdict);
CREATE INDEX idx_validations_validated_at ON validations(validated_at DESC);
```

---

### 1.5 Blueprints

#### `blueprints`

Phase 3 blueprint documents for validated concepts (Phase 3.1–3.6).

```sql
CREATE TABLE blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(id),

  -- Business Model (Phase 3.1)
  revenue_model VARCHAR(255), -- 'subscription', 'usage_based', 'marketplace', 'hybrid'
  pricing_tiers JSONB, -- array of {name, price, features, target_segment}
  customer_journey TEXT,
  expansion_revenue_opportunities JSONB,
  financial_projection_months INT,
  financial_projection JSONB, -- month-by-month: {month, revenue, costs, margin}

  -- Agent Architecture (Phase 3.2)
  agent_roles JSONB, -- array of {role, agent_or_human, responsibilities, tools, decision_boundaries, cost_usd_per_month}
  human_roles JSONB, -- array of {role, responsibilities, headcount, cost_usd_per_year}
  escalation_protocols JSONB,
  operational_cost_breakdown JSONB, -- {agent_compute: X, human: Y, tools: Z, total: X+Y+Z}

  -- Go-to-Market (Phase 3.3)
  gtm_target_segment TEXT,
  gtm_channels JSONB, -- array of {channel, agent_handled: boolean, tactics}
  gtm_messaging_framework TEXT,
  gtm_launch_timeline JSONB, -- {day_1_30: [], day_31_60: [], day_61_90: []}
  agent_gtm_activities JSONB,
  human_gtm_activities JSONB,

  -- Risk Register (Phase 3.4)
  risks JSONB, -- array of {category, description, severity, likelihood, mitigation, monitoring_trigger}

  -- Resource & Runway (Phase 3.5)
  upfront_build_cost BIGINT, -- USD
  monthly_operating_cost BIGINT, -- USD
  hiring_plan JSONB, -- array of {role, headcount, start_month, cost_per_person}
  technology_stack JSONB,
  funding_milestones JSONB, -- array of {milestone, required_funding_usd, month}
  runway_months INT,

  -- Packaging (Phase 3.6)
  executive_summary TEXT,
  internal_consistency_notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255), -- agent name
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_finalized BOOLEAN DEFAULT FALSE,
  finalized_at TIMESTAMP WITH TIME ZONE,

  storage_location_pdf TEXT -- path in Supabase Storage if PDF generated
);

CREATE INDEX idx_blueprints_concept ON blueprints(concept_id);
CREATE INDEX idx_blueprints_finalized ON blueprints(is_finalized);
CREATE INDEX idx_blueprints_created ON blueprints(created_at DESC);
```

---

### 1.6 Pipeline Orchestration & Audit

#### `pipeline_items`

Master table tracking every idea's journey through the pipeline.

```sql
CREATE TABLE pipeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Item identity
  item_type VARCHAR(50), -- 'opportunity', 'concept', 'validation', 'blueprint'
  source_id UUID, -- references sources.id (if sourced from Phase 0)
  market_opportunity_id UUID REFERENCES market_opportunities(id),
  concept_id UUID REFERENCES concepts(id),

  -- Pipeline state
  current_phase VARCHAR(50), -- 'phase_0', 'phase_1', 'phase_2', 'phase_3', 'rejected', 'archived'
  current_step VARCHAR(50), -- e.g., '0.1', '1.3', '2.5', '3.6'
  status VARCHAR(50), -- 'pending', 'in_progress', 'completed', 'failed', 'blocked'

  -- Gate decisions
  last_gate_decision VARCHAR(50), -- 'passed', 'failed', 'overridden'
  last_gate_at TIMESTAMP WITH TIME ZONE,
  last_gate_reason TEXT,
  last_gate_by UUID REFERENCES auth.users(id), -- human reviewer if overridden

  -- Timing
  entered_phase_at TIMESTAMP WITH TIME ZONE,
  entered_step_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Tags and notes
  tags JSONB, -- array of tags for filtering
  priority VARCHAR(20), -- 'low', 'normal', 'high'

  CONSTRAINT item_type_valid CHECK (item_type IN ('opportunity', 'concept', 'validation', 'blueprint')),
  CONSTRAINT phase_valid CHECK (current_phase IN ('phase_0', 'phase_1', 'phase_2', 'phase_3', 'rejected', 'archived')),
  CONSTRAINT status_valid CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'blocked'))
);

CREATE INDEX idx_pipeline_phase ON pipeline_items(current_phase);
CREATE INDEX idx_pipeline_status ON pipeline_items(status);
CREATE INDEX idx_pipeline_concept ON pipeline_items(concept_id);
CREATE INDEX idx_pipeline_entered_phase ON pipeline_items(entered_phase_at DESC);
```

#### `agent_runs`

Audit log of every agent execution (input, output, cost, duration).

```sql
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Agent identity
  agent_name VARCHAR(255) NOT NULL, -- e.g., 'source-scanner', 'concept-generator'
  agent_version VARCHAR(50), -- semantic version
  triggered_by VARCHAR(50), -- 'orchestrator', 'webhook', 'manual', 'schedule'

  -- Related pipeline item
  pipeline_item_id UUID REFERENCES pipeline_items(id),

  -- Execution details
  input_data JSONB,
  output_data JSONB,
  status VARCHAR(50), -- 'success', 'partial', 'failed', 'timeout'
  error_message TEXT,

  -- Resource usage
  execution_duration_seconds INT,
  tokens_input INT, -- if using Claude/GPT
  tokens_output INT,
  cost_usd NUMERIC(8,4),

  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT status_valid CHECK (status IN ('success', 'partial', 'failed', 'timeout'))
);

CREATE INDEX idx_agent_runs_agent ON agent_runs(agent_name);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);
CREATE INDEX idx_agent_runs_started ON agent_runs(started_at DESC);
CREATE INDEX idx_agent_runs_pipeline ON agent_runs(pipeline_item_id);
```

#### `gate_decisions`

Every gate pass/fail/override decision with full context.

```sql
CREATE TABLE gate_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Gate identity
  gate_phase VARCHAR(50), -- 'phase_0', 'phase_1', 'phase_2'
  pipeline_item_id UUID NOT NULL REFERENCES pipeline_items(id),

  -- Decision
  decision VARCHAR(50), -- 'pass', 'fail', 'override_pass', 'override_fail'
  decision_by UUID REFERENCES auth.users(id), -- human reviewer ID, NULL if automated
  decision_reason TEXT,

  -- Context
  pre_decision_data JSONB, -- scores, metrics, reasoning that led to decision
  override_reason TEXT, -- if decision was overridden by human

  -- Timestamps
  decided_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT decision_valid CHECK (decision IN ('pass', 'fail', 'override_pass', 'override_fail'))
);

CREATE INDEX idx_gate_decisions_pipeline ON gate_decisions(pipeline_item_id);
CREATE INDEX idx_gate_decisions_decided_at ON gate_decisions(decided_at DESC);
CREATE INDEX idx_gate_decisions_phase ON gate_decisions(gate_phase);
```

---

### 1.7 User Annotations & Feedback

#### `user_annotations`

Human reviewer notes and overrides at any step.

```sql
CREATE TABLE user_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Annotation target
  annotated_object_type VARCHAR(50), -- 'opportunity', 'concept', 'validation', 'blueprint', 'signal'
  annotated_object_id UUID NOT NULL,

  -- Annotation content
  annotation_type VARCHAR(50), -- 'note', 'flag', 'override_score', 'suggest_rejection', 'suggest_advancement'
  content TEXT,

  -- If score override
  score_override_dimension VARCHAR(255),
  score_override_value NUMERIC(3,2),
  override_reason TEXT,

  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT annotation_type_valid CHECK (annotation_type IN ('note', 'flag', 'override_score', 'suggest_rejection', 'suggest_advancement'))
);

CREATE INDEX idx_annotations_object ON user_annotations(annotated_object_type, annotated_object_id);
CREATE INDEX idx_annotations_created_by ON user_annotations(created_by);
CREATE INDEX idx_annotations_created_at ON user_annotations(created_at DESC);
```

#### `feedback_events`

Outcome data feeding back to earlier phases for continuous improvement.

```sql
CREATE TABLE feedback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What happened
  event_type VARCHAR(50), -- 'validation_passed', 'validation_failed', 'blueprint_launched', 'gate_override'
  related_concept_id UUID REFERENCES concepts(id),

  -- Outcome
  outcome TEXT, -- structured outcome summary
  outcome_confidence NUMERIC(3,2),

  -- Learning
  learning_for_phase VARCHAR(50), -- which earlier phase should be tuned
  learning_detail TEXT,

  -- Metadata
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedback_events_type ON feedback_events(event_type);
CREATE INDEX idx_feedback_events_concept ON feedback_events(related_concept_id);
CREATE INDEX idx_feedback_events_occurred ON feedback_events(occurred_at DESC);
```

---

## 2. Row Level Security (RLS)

RLS policies enforce multi-user access control based on roles and ownership.

### 2.1 Role Definitions

Four roles are defined in the Supabase Auth system:

- **Admin** — Full read/write/delete access to all tables.
- **Reviewer** — Read-only access to pipeline data; can create annotations and gate overrides.
- **Viewer** — Read-only access to published watchlists and finalized blueprints.
- **Agent-Service** — Write access to agent_runs, pipeline_items, and data produced by agents; limited read on inputs.

### 2.2 RLS Policy Examples

#### For `concepts` table:

```sql
-- Enable RLS
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;

-- Admins see all rows
CREATE POLICY admin_access_concepts ON concepts
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Reviewers can read all, create annotations but not modify core data
CREATE POLICY reviewer_read_concepts ON concepts
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );

-- Viewers can only see selected concepts
CREATE POLICY viewer_read_concepts ON concepts
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'viewer'
    AND selected_for_validation = TRUE
  );

-- Only service role (agents) can insert
CREATE POLICY agent_insert_concepts ON concepts
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'agent-service'
  );
```

#### For `user_annotations` table:

```sql
ALTER TABLE user_annotations ENABLE ROW LEVEL SECURITY;

-- Users can read all annotations
CREATE POLICY read_all_annotations ON user_annotations
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('admin', 'reviewer', 'viewer')
  );

-- Users can only create their own annotations
CREATE POLICY insert_own_annotations ON user_annotations
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
  );

-- Admins can update/delete any annotation
CREATE POLICY admin_manage_annotations ON user_annotations
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin'
  );
```

### 2.3 Agent Authentication

Agents authenticate to Supabase in one of two ways:

**Service Role Key** (for trusted infrastructure):
- Used by Vercel Edge Functions and internal services
- Has unrestricted access; must be stored securely (env vars only, never client-side)
- Used for writing agent_runs, updating pipeline_items, inserting concepts/validations

**Per-Agent Tokens** (for external agent services):
- JWT tokens scoped to a specific agent service account
- Tokens expire after 24 hours; refreshed via Supabase Auth
- Restricted to INSERT on agent_runs, SELECT/UPDATE on their input tables
- Example: `agent-source-scanner@company-builder.internal`

```typescript
// Example: Agent authenticating with scoped token
const { data, error } = await supabaseClient
  .from('agent_runs')
  .insert([{
    agent_name: 'source-scanner',
    pipeline_item_id: itemId,
    input_data: { /* ... */ },
    status: 'in_progress',
    started_at: new Date().toISOString()
  }])
  .select();
```

---

## 3. Realtime Configuration

Supabase Realtime allows the UI to subscribe to database changes in real-time.

### 3.1 Realtime-Enabled Tables

Tables with Realtime enabled:

| Table | Why | Subscription Pattern |
|-------|-----|----------------------|
| `pipeline_items` | Live pipeline status updates | Subscribe to specific concept/opportunity |
| `agent_runs` | Watch agent execution progress | Subscribe to agent_name or pipeline_item_id |
| `gate_decisions` | See gate outcomes immediately | Subscribe to phase gate |
| `user_annotations` | Collaborative real-time notes | Subscribe to annotated_object_id |
| `watchlist_versions` | New watchlist published | Subscribe to all; broadcast to dashboard |

Tables NOT realtime:
- `content_items`, `sources`, `signals`, `concepts` — too high volume, use polling instead
- `validations`, `blueprints` — less frequent updates, polling acceptable

### 3.2 Publication Configuration

```sql
-- Create publication for realtime
CREATE PUBLICATION supabase_realtime FOR TABLE
  pipeline_items,
  agent_runs,
  gate_decisions,
  user_annotations,
  watchlist_versions;

-- Configure which columns to replicate (optional, reduces payload)
ALTER PUBLICATION supabase_realtime SET (
  publish = 'insert,update,delete'
);
```

### 3.3 UI Subscription Examples

```typescript
// TypeScript client example: Subscribe to pipeline item changes
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Watch pipeline status for a specific concept
const subscription = supabase
  .channel('pipeline:concept:' + conceptId)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'pipeline_items',
      filter: `concept_id=eq.${conceptId}`
    },
    (payload) => {
      console.log('Pipeline updated:', payload);
      // Re-render dashboard
    }
  )
  .subscribe();

// Watch all agent runs for an agent
const agentRunSubscription = supabase
  .channel('agent_runs:source-scanner')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'agent_runs',
      filter: `agent_name=eq.source-scanner`
    },
    (payload) => {
      console.log('New agent run:', payload.new);
    }
  )
  .subscribe();

// Unsubscribe when done
subscription.unsubscribe();
```

---

## 4. Edge Functions

Supabase Edge Functions (Deno-based, running on Cloudflare Workers) complement Vercel serverless functions.

### 4.1 Where to Use Edge Functions

**Good use cases for Edge Functions:**

1. **Webhook handlers** — Receive signals from external sources (e.g., Product Hunt API, RSS feed polling)
   - Function: `functions/webhooks/product-hunt.ts`
   - Receives: POST from Product Hunt API
   - Action: Insert into content_items, trigger signal-detector

2. **Scheduled agent triggers** — Cron-like periodic tasks
   - Function: `functions/schedules/phase0-scan.ts`
   - Triggered by: `pg_cron` job or external cron service
   - Action: Trigger source-scanner agent

3. **Light database operations** — Simple inserts, updates, status checks
   - Low latency, no warm-up time
   - Edge location closer to users

4. **Real-time WebSocket bridges** — Forward Realtime changes to external services
   - Function: `functions/realtime-bridges/slack-notification.ts`
   - Listens to agent_runs changes, posts to Slack

**Avoid Edge Functions for:**
- Heavy compute (use Vercel or external agents)
- Long-running operations (50-second timeout)
- Complex ML tasks

### 4.2 Example Edge Function: Webhook Handler

```typescript
// functions/webhooks/content-ingestion.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { content, source_id } = await req.json()

  // Deduplicate
  const { data: existing } = await supabase
    .from('content_items')
    .select('id')
    .eq('content_hash', hashContent(content))
    .single()

  if (existing) {
    return new Response(JSON.stringify({ status: 'duplicate' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Insert new content item
  const { data, error } = await supabase
    .from('content_items')
    .insert([{
      source_id,
      title: content.title,
      body: content.body,
      url: content.url,
      published_at: content.published_at,
      content_hash: hashContent(content),
      metadata: content.metadata
    }])
    .select()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Trigger signal-detector agent
  await supabase
    .from('agent_runs')
    .insert([{
      agent_name: 'signal-detector',
      triggered_by: 'webhook',
      input_data: { content_item_id: data[0].id },
      status: 'pending'
    }])

  return new Response(JSON.stringify({ success: true, item_id: data[0].id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### 4.3 Example Edge Function: Scheduled Task Trigger

```typescript
// functions/schedules/phase0-scan.ts
// Triggered by pg_cron every 6 hours
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get active sources
  const { data: sources, error: sourceError } = await supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)

  if (sourceError) throw sourceError

  // Create agent runs for each source
  const runs = sources.map(source => ({
    agent_name: 'source-scanner',
    triggered_by: 'schedule',
    input_data: { source_id: source.id },
    status: 'pending'
  }))

  const { error: insertError } = await supabase
    .from('agent_runs')
    .insert(runs)

  if (insertError) throw insertError

  return new Response(
    JSON.stringify({ message: `Triggered ${runs.length} source scans` }),
    { status: 200 }
  )
})
```

---

## 5. Database Functions and Triggers

Postgres functions and triggers automate common operations and ensure data consistency.

### 5.1 Core Database Functions

#### Function: Advance Pipeline State

```sql
CREATE OR REPLACE FUNCTION advance_pipeline_state(
  p_pipeline_item_id UUID,
  p_new_phase VARCHAR,
  p_new_step VARCHAR,
  p_new_status VARCHAR
)
RETURNS TABLE (
  updated_at TIMESTAMP WITH TIME ZONE,
  current_phase VARCHAR,
  current_step VARCHAR,
  status VARCHAR
) AS $$
BEGIN
  UPDATE pipeline_items
  SET
    current_phase = p_new_phase,
    current_step = p_new_step,
    status = p_new_status,
    entered_phase_at = CASE WHEN current_phase != p_new_phase THEN NOW() ELSE entered_phase_at END,
    entered_step_at = NOW(),
    updated_at = NOW()
  WHERE id = p_pipeline_item_id
  RETURNING NOW(), current_phase, current_step, status;
END;
$$ LANGUAGE plpgsql;
```

#### Function: Compute Composite Opportunity Score

```sql
CREATE OR REPLACE FUNCTION compute_composite_opportunity_score(
  p_market_opportunity_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_composite NUMERIC;
BEGIN
  SELECT
    (
      (market_size_score * weight_market_size) +
      (signal_convergence_score * weight_signal_convergence) +
      (agent_readiness_score * weight_agent_readiness) +
      (competitive_density_score * weight_competitive_density) +
      (timing_confidence_score * weight_timing_confidence)
    ) INTO v_composite
  FROM opportunity_scores
  WHERE market_opportunity_id = p_market_opportunity_id
  ORDER BY scored_at DESC
  LIMIT 1;

  RETURN COALESCE(v_composite, 0.0);
END;
$$ LANGUAGE plpgsql;
```

#### Function: Create Watchlist Snapshot

```sql
CREATE OR REPLACE FUNCTION create_watchlist_snapshot()
RETURNS TABLE (
  version_number INT,
  total_opportunities INT,
  published_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_version_num INT;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_num
  FROM watchlist_versions;

  -- Build snapshot: top opportunities with latest scores
  INSERT INTO watchlist_versions (version_number, snapshot_data, total_opportunities, published_at)
  SELECT
    v_version_num,
    jsonb_agg(
      jsonb_build_object(
        'id', mo.id,
        'title', mo.title,
        'market', mo.target_market,
        'score', (SELECT composite_score FROM opportunity_scores WHERE market_opportunity_id = mo.id ORDER BY scored_at DESC LIMIT 1),
        'rank', ROW_NUMBER() OVER (ORDER BY (SELECT composite_score FROM opportunity_scores WHERE market_opportunity_id = mo.id ORDER BY scored_at DESC LIMIT 1) DESC)
      )
    ),
    COUNT(*),
    NOW()
  FROM market_opportunities mo
  WHERE is_active = TRUE
  RETURNING version_number, total_opportunities, published_at;
END;
$$ LANGUAGE plpgsql;
```

### 5.2 Triggers for Event Propagation

#### Trigger: On Agent Run Completion → Update Pipeline Status

```sql
CREATE OR REPLACE FUNCTION on_agent_run_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('success', 'partial', 'failed') AND OLD.status = 'in_progress' THEN
    -- Mark pipeline item as completed (or move to next step)
    UPDATE pipeline_items
    SET status = CASE
      WHEN NEW.status = 'success' THEN 'completed'
      WHEN NEW.status = 'failed' THEN 'failed'
      ELSE 'in_progress'
    END,
    updated_at = NOW()
    WHERE id = NEW.pipeline_item_id;

    -- If success, trigger next agent (orchestrator will pick this up)
    IF NEW.status = 'success' THEN
      INSERT INTO agent_runs (
        agent_name,
        triggered_by,
        pipeline_item_id,
        status,
        input_data
      ) VALUES (
        'next-agent-to-run',
        'orchestrator',
        NEW.pipeline_item_id,
        'pending',
        NEW.output_data
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agent_run_completed
AFTER UPDATE ON agent_runs
FOR EACH ROW
EXECUTE FUNCTION on_agent_run_completed();
```

#### Trigger: On Concept Insert → Create Empty Validation Record

```sql
CREATE OR REPLACE FUNCTION on_concept_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO validations (concept_id, validation_phase, validated_at)
  VALUES (NEW.id, 'synthesis', NOW());

  INSERT INTO pipeline_items (
    item_type,
    concept_id,
    current_phase,
    current_step,
    status,
    entered_phase_at,
    entered_step_at
  ) VALUES (
    'concept',
    NEW.id,
    'phase_1',
    '1.3',
    'completed',
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_concept_created
AFTER INSERT ON concepts
FOR EACH ROW
EXECUTE FUNCTION on_concept_created();
```

### 5.3 Scheduled Tasks with pg_cron

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Every 6 hours: scan active sources
SELECT cron.schedule(
  'scan_sources_schedule',
  '0 */6 * * *',
  'SELECT trigger_phase0_scan()'
);

-- Every 24 hours: create watchlist snapshot
SELECT cron.schedule(
  'watchlist_snapshot_schedule',
  '0 0 * * *',
  'SELECT create_watchlist_snapshot()'
);

-- Every 12 hours: clean up old agent runs (keep last 90 days)
SELECT cron.schedule(
  'cleanup_agent_runs',
  '0 */12 * * *',
  'DELETE FROM agent_runs WHERE started_at < NOW() - INTERVAL ''90 days'''
);
```

---

## 6. Storage

Supabase Storage holds large artifacts: blueprint PDFs, detailed reports, evidence attachments.

### 6.1 Bucket Structure

```
company-builder/
├── blueprints/              # Final blueprint documents
│   ├── {concept_id}/blueprint.pdf
│   └── {concept_id}/blueprint.json
├── validations/             # Validation reports
│   ├── {concept_id}/market_analysis.pdf
│   ├── {concept_id}/competitive_analysis.json
│   └── {concept_id}/customer_research.pdf
├── landscape-reports/       # Phase 1 landscape analysis
│   ├── {market_opp_id}/landscape.json
│   └── {market_opp_id}/incumbents.json
├── signals/                 # Signal evidence attachments
│   ├── {signal_id}/evidence.pdf
│   └── {signal_id}/links.json
└── exports/                 # User-generated exports
    ├── {user_id}/watchlist-export-{date}.csv
    └── {user_id}/analysis-{date}.xlsx
```

### 6.2 Access Policies

```sql
-- Blueprints: anyone authenticated can read, only creators can write
CREATE POLICY blueprint_read_authenticated ON storage.objects
  FOR SELECT USING (
    bucket_id = 'company-builder'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'blueprints'
  );

CREATE POLICY blueprint_write_own ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'company-builder'
    AND (storage.foldername(name))[1] = 'blueprints'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

-- Validations: read by reviewers, write by agents
CREATE POLICY validation_read ON storage.objects
  FOR SELECT USING (
    bucket_id = 'company-builder'
    AND (storage.foldername(name))[1] = 'validations'
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );
```

### 6.3 Upload Example

```typescript
// Upload blueprint PDF
const { data, error } = await supabase.storage
  .from('company-builder')
  .upload(
    `blueprints/${conceptId}/blueprint.pdf`,
    pdfBlob,
    {
      cacheControl: '3600',
      upsert: true,
      contentType: 'application/pdf'
    }
  )

// Get signed download URL (valid for 1 hour)
const { data: signedUrl } = await supabase.storage
  .from('company-builder')
  .createSignedUrl(`blueprints/${conceptId}/blueprint.pdf`, 3600)
```

---

## 7. Migrations and Versioning

Use Supabase CLI for schema versioning.

### 7.1 Migration Workflow

```bash
# Create a new migration
supabase migration new add_concepts_table

# Apply migrations
supabase migration up

# Generate migration from current schema (if starting from existing DB)
supabase db pull
```

### 7.2 Migration File Example

```sql
-- migrations/20240310120000_create_core_tables.sql
-- Create sources table
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  source_type VARCHAR(50) NOT NULL,
  url TEXT,
  api_key TEXT,
  config JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT source_type_valid CHECK (source_type IN ('rss', 'api', 'webpage', 'research_db'))
);

-- Create content_items table
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  external_id VARCHAR(512),
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  ingested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  content_hash VARCHAR(64),
  metadata JSONB,
  is_duplicate BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,

  UNIQUE(source_id, external_id),
  CONSTRAINT url_or_body CHECK (url IS NOT NULL OR body IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_sources_active ON sources(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_content_items_source ON content_items(source_id);
CREATE INDEX idx_content_items_hash ON content_items(content_hash);
```

### 7.3 Seed Data for Development

```sql
-- seeds/dev-data.sql
-- Insert sample sources
INSERT INTO sources (name, source_type, url, is_active, created_by) VALUES
  ('Product Hunt', 'api', 'https://api.producthunt.com', TRUE, NULL),
  ('Hacker News', 'api', 'https://news.ycombinator.com', TRUE, NULL),
  ('ArXiv', 'rss', 'https://arxiv.org/list/cs.AI/recent', TRUE, NULL)
ON CONFLICT (name) DO NOTHING;

-- Insert sample market opportunity
INSERT INTO market_opportunities (
  title,
  description,
  target_market,
  target_industry,
  problem_statement,
  agent_readiness_tag,
  is_active
) VALUES (
  'AI-Powered Customer Support Automation',
  'Automating customer support with agents for SaaS companies',
  'Enterprise SaaS',
  'Software/Tech',
  'High cost of hiring support teams; long response times; poor 24/7 coverage',
  'high',
  TRUE
);
```

---

## 8. Performance

### 8.1 Indexing Strategy

Key indexes for common query patterns:

```sql
-- Phase 0 queries
CREATE INDEX idx_opportunities_ranked ON market_opportunities(ranked_at DESC)
WHERE is_active = TRUE;

CREATE INDEX idx_opportunity_scores_composite ON opportunity_scores(composite_score DESC);

-- Phase 1 queries
CREATE INDEX idx_concepts_selected ON concepts(selected_for_validation)
WHERE is_active = TRUE;

CREATE INDEX idx_concept_scores_composite ON concept_scores(composite_score DESC);

-- Pipeline dashboard
CREATE INDEX idx_pipeline_phase_status ON pipeline_items(current_phase, status);

CREATE INDEX idx_agent_runs_agent_status ON agent_runs(agent_name, status);

-- Time-range queries
CREATE INDEX idx_agent_runs_started_at ON agent_runs(started_at DESC);

CREATE INDEX idx_content_items_published ON content_items(published_at DESC);

-- Full-text search (if needed)
CREATE INDEX idx_content_items_title_body ON content_items
USING GIN (to_tsvector('english', title || ' ' || COALESCE(body, '')));
```

### 8.2 Partitioning for High-Volume Tables

For production deployments with millions of content items:

```sql
-- Partition content_items by month
CREATE TABLE content_items_2024_01 PARTITION OF content_items
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE content_items_2024_02 PARTITION OF content_items
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Similarly for signals and agent_runs if volume warrants it
```

### 8.3 Connection Pooling

Supabase provides PgBouncer connection pooling at the session level. Configure Vercel functions to use pooled connections:

```typescript
// Use pooled connection string for API routes
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public'
    }
  }
)

// Reuse the client across function invocations
export default supabase
```

### 8.4 Query Optimization Examples

```typescript
// Good: Select only needed columns
const { data } = await supabase
  .from('pipeline_items')
  .select('id, current_phase, status')
  .eq('current_phase', 'phase_1')

// Avoid: SELECT * with JOINs across large tables
const { data } = await supabase
  .from('concepts')
  .select('*, opportunity_scores(*)')  // Avoid for large result sets

// Better: Aggregate on database side
const { data } = await supabase
  .from('opportunity_scores')
  .select('market_opportunity_id, AVG(composite_score)')
  .group_by('market_opportunity_id')
```

---

## 9. Backup and Recovery

Supabase provides automated backups with point-in-time recovery.

### 9.1 Backup Configuration

In Supabase Dashboard:
- Automated daily backups retained for 30 days
- Point-in-time recovery available within 7 days
- No action required; built-in to Supabase

### 9.2 Manual Export

Export data for analysis or archival:

```bash
# Export entire database
pg_dump -h db.supabase.co -U postgres -Fc company_builder > backup.dump

# Export specific table
pg_dump -h db.supabase.co -U postgres -Fc -t concepts company_builder > concepts-backup.dump

# Restore
pg_restore -h db.supabase.co -U postgres -Fc backup.dump
```

### 9.3 Data Retention Policy

```sql
-- Archive old content items (keep 2 years)
UPDATE content_items
SET is_archived = TRUE
WHERE ingested_at < NOW() - INTERVAL '2 years';

-- Archive old agent runs (keep 1 year)
DELETE FROM agent_runs
WHERE started_at < NOW() - INTERVAL '1 year'
AND status = 'success';
```

---

## 10. Reference SQL: Complete Schema Creation

Complete, production-ready SQL to create the entire schema:

```sql
-- ============================================================================
-- PHASE 0: CONTENT INGESTION & DISCOVERY
-- ============================================================================

CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  source_type VARCHAR(50) NOT NULL,
  url TEXT,
  api_key TEXT,
  config JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT source_type_valid CHECK (source_type IN ('rss', 'api', 'webpage', 'research_db'))
);

CREATE INDEX idx_sources_active ON sources(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_sources_type ON sources(source_type);

CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  external_id VARCHAR(512),
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  ingested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  content_hash VARCHAR(64),
  metadata JSONB,
  is_duplicate BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,

  UNIQUE(source_id, external_id),
  CONSTRAINT url_or_body CHECK (url IS NOT NULL OR body IS NOT NULL)
);

CREATE INDEX idx_content_items_source ON content_items(source_id);
CREATE INDEX idx_content_items_published ON content_items(published_at DESC);
CREATE INDEX idx_content_items_ingested ON content_items(ingested_at DESC);
CREATE INDEX idx_content_items_hash ON content_items(content_hash);
CREATE INDEX idx_content_items_archived ON content_items(is_archived) WHERE is_archived = FALSE;

CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  signal_type VARCHAR(50) NOT NULL,
  summary TEXT NOT NULL,
  confidence NUMERIC(3,2),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  detected_by VARCHAR(255),
  entities JSONB,
  impact_rating VARCHAR(20),
  is_archived BOOLEAN DEFAULT FALSE,

  CONSTRAINT signal_type_valid CHECK (signal_type IN ('tech_breakthrough', 'regulatory_shift', 'market_event', 'customer_pain')),
  CONSTRAINT confidence_range CHECK (confidence >= 0.0 AND confidence <= 1.0)
);

CREATE INDEX idx_signals_type ON signals(signal_type);
CREATE INDEX idx_signals_detected ON signals(detected_at DESC);
CREATE INDEX idx_signals_confidence ON signals(confidence DESC);
CREATE INDEX idx_signals_archived ON signals(is_archived) WHERE is_archived = FALSE;

CREATE TABLE market_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(512) NOT NULL,
  description TEXT,
  target_market VARCHAR(255),
  target_industry VARCHAR(255),
  problem_statement TEXT,
  enabling_signals JSONB,
  agent_readiness_tag VARCHAR(50),
  market_size_estimate BIGINT,
  market_size_confidence NUMERIC(3,2),
  competitive_density VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ranked_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  archived_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT agent_readiness_valid CHECK (agent_readiness_tag IN ('high', 'medium', 'low')),
  CONSTRAINT competitive_density_valid CHECK (competitive_density IN ('crowded', 'moderate', 'sparse'))
);

CREATE INDEX idx_market_opp_active ON market_opportunities(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_market_opp_ranked ON market_opportunities(ranked_at DESC);
CREATE INDEX idx_market_opp_industry ON market_opportunities(target_industry);

CREATE TABLE opportunity_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_opportunity_id UUID NOT NULL REFERENCES market_opportunities(id) ON DELETE CASCADE,
  scored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scored_by VARCHAR(255),

  market_size_score NUMERIC(3,2),
  signal_convergence_score NUMERIC(3,2),
  agent_readiness_score NUMERIC(3,2),
  competitive_density_score NUMERIC(3,2),
  timing_confidence_score NUMERIC(3,2),

  composite_score NUMERIC(3,2),

  weight_market_size NUMERIC(3,2) DEFAULT 0.25,
  weight_signal_convergence NUMERIC(3,2) DEFAULT 0.25,
  weight_agent_readiness NUMERIC(3,2) DEFAULT 0.20,
  weight_competitive_density NUMERIC(3,2) DEFAULT 0.15,
  weight_timing_confidence NUMERIC(3,2) DEFAULT 0.15,

  reasoning TEXT
);

CREATE INDEX idx_opp_scores_composite ON opportunity_scores(composite_score DESC);
CREATE INDEX idx_opp_scores_market_opp ON opportunity_scores(market_opportunity_id);
CREATE INDEX idx_opp_scores_scored_at ON opportunity_scores(scored_at DESC);

CREATE TABLE watchlist_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number INT NOT NULL UNIQUE,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  snapshot_data JSONB,
  total_opportunities INT,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_watchlist_versions_published ON watchlist_versions(published_at DESC);

-- ============================================================================
-- PHASE 1: IDEATION
-- ============================================================================

CREATE TABLE concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_opportunity_id UUID NOT NULL REFERENCES market_opportunities(id),
  title VARCHAR(512) NOT NULL,
  summary TEXT,

  value_proposition TEXT,
  target_customer_segment TEXT,
  pain_points_addressed JSONB,
  agent_architecture_sketch TEXT,
  defensibility_notes TEXT,

  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by VARCHAR(255),
  source_phase VARCHAR(50),

  is_active BOOLEAN DEFAULT TRUE,
  selected_for_validation BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_concepts_market_opp ON concepts(market_opportunity_id);
CREATE INDEX idx_concepts_active ON concepts(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_concepts_selected ON concepts(selected_for_validation) WHERE selected_for_validation = TRUE;

CREATE TABLE concept_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  scored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scored_by VARCHAR(255),

  disruption_potential NUMERIC(3,2),
  agent_readiness NUMERIC(3,2),
  feasibility NUMERIC(3,2),
  differentiation NUMERIC(3,2),
  revenue_clarity NUMERIC(3,2),

  composite_score NUMERIC(3,2),

  weight_disruption NUMERIC(3,2) DEFAULT 0.25,
  weight_agent_readiness NUMERIC(3,2) DEFAULT 0.25,
  weight_feasibility NUMERIC(3,2) DEFAULT 0.20,
  weight_differentiation NUMERIC(3,2) DEFAULT 0.15,
  weight_revenue_clarity NUMERIC(3,2) DEFAULT 0.15,

  reasoning TEXT
);

CREATE INDEX idx_concept_scores_composite ON concept_scores(composite_score DESC);
CREATE INDEX idx_concept_scores_concept ON concept_scores(concept_id);

-- ============================================================================
-- PHASE 2: VALIDATION
-- ============================================================================

CREATE TABLE validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  validation_phase VARCHAR(50),

  -- Market Sizing
  tam_estimate BIGINT,
  tam_confidence NUMERIC(3,2),
  sam_estimate BIGINT,
  som_estimate BIGINT,
  growth_rate_percent NUMERIC(5,2),
  market_sizing_methodology TEXT,

  -- Competitive Analysis
  competitors JSONB,
  vulnerability_map JSONB,
  competitive_intensity VARCHAR(50),

  -- Customer Validation
  pain_point_evidence JSONB,
  early_adopter_profile TEXT,
  willingness_to_pay_low BIGINT,
  willingness_to_pay_high BIGINT,
  customer_validation_confidence NUMERIC(3,2),

  -- Feasibility Assessment
  required_ai_capabilities JSONB,
  technical_risks JSONB,
  regulatory_barriers TEXT,
  showstoppers JSONB,
  feasibility_rating VARCHAR(50),

  -- Unit Economics
  cac BIGINT,
  ltv BIGINT,
  ltv_cac_ratio NUMERIC(5,2),
  gross_margin_percent NUMERIC(5,2),
  breakeven_months INT,
  unit_economics_json JSONB,

  -- Synthesis & Verdict
  verdict VARCHAR(50),
  confidence NUMERIC(3,2),
  summary TEXT,
  key_assumptions JSONB,
  risks JSONB,

  -- Metadata
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_by VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT validation_phase_valid CHECK (validation_phase IN ('market_sizing', 'competitive', 'customer', 'feasibility', 'economics', 'synthesis')),
  CONSTRAINT verdict_valid CHECK (verdict IN ('go', 'go_with_caution', 'no_go'))
);

CREATE INDEX idx_validations_concept ON validations(concept_id);
CREATE INDEX idx_validations_verdict ON validations(verdict);
CREATE INDEX idx_validations_validated_at ON validations(validated_at DESC);

-- ============================================================================
-- PHASE 3: BLUEPRINT
-- ============================================================================

CREATE TABLE blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(id),

  -- Business Model
  revenue_model VARCHAR(255),
  pricing_tiers JSONB,
  customer_journey TEXT,
  expansion_revenue_opportunities JSONB,
  financial_projection_months INT,
  financial_projection JSONB,

  -- Agent Architecture
  agent_roles JSONB,
  human_roles JSONB,
  escalation_protocols JSONB,
  operational_cost_breakdown JSONB,

  -- Go-to-Market
  gtm_target_segment TEXT,
  gtm_channels JSONB,
  gtm_messaging_framework TEXT,
  gtm_launch_timeline JSONB,
  agent_gtm_activities JSONB,
  human_gtm_activities JSONB,

  -- Risk Register
  risks JSONB,

  -- Resource & Runway
  upfront_build_cost BIGINT,
  monthly_operating_cost BIGINT,
  hiring_plan JSONB,
  technology_stack JSONB,
  funding_milestones JSONB,
  runway_months INT,

  -- Packaging
  executive_summary TEXT,
  internal_consistency_notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_finalized BOOLEAN DEFAULT FALSE,
  finalized_at TIMESTAMP WITH TIME ZONE,

  storage_location_pdf TEXT
);

CREATE INDEX idx_blueprints_concept ON blueprints(concept_id);
CREATE INDEX idx_blueprints_finalized ON blueprints(is_finalized);
CREATE INDEX idx_blueprints_created ON blueprints(created_at DESC);

-- ============================================================================
-- PIPELINE ORCHESTRATION & AUDIT
-- ============================================================================

CREATE TABLE pipeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  item_type VARCHAR(50),
  source_id UUID,
  market_opportunity_id UUID REFERENCES market_opportunities(id),
  concept_id UUID REFERENCES concepts(id),

  current_phase VARCHAR(50),
  current_step VARCHAR(50),
  status VARCHAR(50),

  last_gate_decision VARCHAR(50),
  last_gate_at TIMESTAMP WITH TIME ZONE,
  last_gate_reason TEXT,
  last_gate_by UUID REFERENCES auth.users(id),

  entered_phase_at TIMESTAMP WITH TIME ZONE,
  entered_step_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  tags JSONB,
  priority VARCHAR(20),

  CONSTRAINT item_type_valid CHECK (item_type IN ('opportunity', 'concept', 'validation', 'blueprint')),
  CONSTRAINT phase_valid CHECK (current_phase IN ('phase_0', 'phase_1', 'phase_2', 'phase_3', 'rejected', 'archived')),
  CONSTRAINT status_valid CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'blocked'))
);

CREATE INDEX idx_pipeline_phase ON pipeline_items(current_phase);
CREATE INDEX idx_pipeline_status ON pipeline_items(status);
CREATE INDEX idx_pipeline_concept ON pipeline_items(concept_id);
CREATE INDEX idx_pipeline_entered_phase ON pipeline_items(entered_phase_at DESC);

CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  agent_name VARCHAR(255) NOT NULL,
  agent_version VARCHAR(50),
  triggered_by VARCHAR(50),

  pipeline_item_id UUID REFERENCES pipeline_items(id),

  input_data JSONB,
  output_data JSONB,
  status VARCHAR(50),
  error_message TEXT,

  execution_duration_seconds INT,
  tokens_input INT,
  tokens_output INT,
  cost_usd NUMERIC(8,4),

  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT status_valid CHECK (status IN ('success', 'partial', 'failed', 'timeout'))
);

CREATE INDEX idx_agent_runs_agent ON agent_runs(agent_name);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);
CREATE INDEX idx_agent_runs_started ON agent_runs(started_at DESC);
CREATE INDEX idx_agent_runs_pipeline ON agent_runs(pipeline_item_id);

CREATE TABLE gate_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  gate_phase VARCHAR(50),
  pipeline_item_id UUID NOT NULL REFERENCES pipeline_items(id),

  decision VARCHAR(50),
  decision_by UUID REFERENCES auth.users(id),
  decision_reason TEXT,

  pre_decision_data JSONB,
  override_reason TEXT,

  decided_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT decision_valid CHECK (decision IN ('pass', 'fail', 'override_pass', 'override_fail'))
);

CREATE INDEX idx_gate_decisions_pipeline ON gate_decisions(pipeline_item_id);
CREATE INDEX idx_gate_decisions_decided_at ON gate_decisions(decided_at DESC);
CREATE INDEX idx_gate_decisions_phase ON gate_decisions(gate_phase);

CREATE TABLE user_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  annotated_object_type VARCHAR(50),
  annotated_object_id UUID NOT NULL,

  annotation_type VARCHAR(50),
  content TEXT,

  score_override_dimension VARCHAR(255),
  score_override_value NUMERIC(3,2),
  override_reason TEXT,

  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT annotation_type_valid CHECK (annotation_type IN ('note', 'flag', 'override_score', 'suggest_rejection', 'suggest_advancement'))
);

CREATE INDEX idx_annotations_object ON user_annotations(annotated_object_type, annotated_object_id);
CREATE INDEX idx_annotations_created_by ON user_annotations(created_by);
CREATE INDEX idx_annotations_created_at ON user_annotations(created_at DESC);

CREATE TABLE feedback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  event_type VARCHAR(50),
  related_concept_id UUID REFERENCES concepts(id),

  outcome TEXT,
  outcome_confidence NUMERIC(3,2),

  learning_for_phase VARCHAR(50),
  learning_detail TEXT,

  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedback_events_type ON feedback_events(event_type);
CREATE INDEX idx_feedback_events_concept ON feedback_events(related_concept_id);
CREATE INDEX idx_feedback_events_occurred ON feedback_events(occurred_at DESC);

-- ============================================================================
-- ENABLE REALTIME ON KEY TABLES
-- ============================================================================

ALTER TABLE pipeline_items REPLICA IDENTITY FULL;
ALTER TABLE agent_runs REPLICA IDENTITY FULL;
ALTER TABLE gate_decisions REPLICA IDENTITY FULL;
ALTER TABLE user_annotations REPLICA IDENTITY FULL;
ALTER TABLE watchlist_versions REPLICA IDENTITY FULL;

CREATE PUBLICATION supabase_realtime FOR TABLE
  pipeline_items,
  agent_runs,
  gate_decisions,
  user_annotations,
  watchlist_versions;

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION advance_pipeline_state(
  p_pipeline_item_id UUID,
  p_new_phase VARCHAR,
  p_new_step VARCHAR,
  p_new_status VARCHAR
)
RETURNS TABLE (
  updated_at TIMESTAMP WITH TIME ZONE,
  current_phase VARCHAR,
  current_step VARCHAR,
  status VARCHAR
) AS $$
BEGIN
  UPDATE pipeline_items
  SET
    current_phase = p_new_phase,
    current_step = p_new_step,
    status = p_new_status,
    entered_phase_at = CASE WHEN current_phase != p_new_phase THEN NOW() ELSE entered_phase_at END,
    entered_step_at = NOW()
  WHERE id = p_pipeline_item_id
  RETURNING NOW(), current_phase, current_step, status;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION compute_composite_opportunity_score(
  p_market_opportunity_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_composite NUMERIC;
BEGIN
  SELECT
    (
      (market_size_score * weight_market_size) +
      (signal_convergence_score * weight_signal_convergence) +
      (agent_readiness_score * weight_agent_readiness) +
      (competitive_density_score * weight_competitive_density) +
      (timing_confidence_score * weight_timing_confidence)
    ) INTO v_composite
  FROM opportunity_scores
  WHERE market_opportunity_id = p_market_opportunity_id
  ORDER BY scored_at DESC
  LIMIT 1;

  RETURN COALESCE(v_composite, 0.0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_watchlist_snapshot()
RETURNS TABLE (
  version_number INT,
  total_opportunities INT,
  published_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_version_num INT;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_num
  FROM watchlist_versions;

  INSERT INTO watchlist_versions (version_number, snapshot_data, total_opportunities, published_at)
  SELECT
    v_version_num,
    jsonb_agg(
      jsonb_build_object(
        'id', mo.id,
        'title', mo.title,
        'market', mo.target_market,
        'score', (SELECT composite_score FROM opportunity_scores WHERE market_opportunity_id = mo.id ORDER BY scored_at DESC LIMIT 1),
        'rank', ROW_NUMBER() OVER (ORDER BY (SELECT composite_score FROM opportunity_scores WHERE market_opportunity_id = mo.id ORDER BY scored_at DESC LIMIT 1) DESC)
      )
    ),
    COUNT(*),
    NOW()
  FROM market_opportunities mo
  WHERE is_active = TRUE
  RETURNING version_number, total_opportunities, published_at;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EXAMPLE QUERIES FOR COMMON OPERATIONS
-- ============================================================================

-- Get ranked opportunities for Phase 0 watchlist
SELECT
  mo.id,
  mo.title,
  mo.target_market,
  (SELECT composite_score FROM opportunity_scores WHERE market_opportunity_id = mo.id ORDER BY scored_at DESC LIMIT 1) as score,
  ROW_NUMBER() OVER (ORDER BY (SELECT composite_score FROM opportunity_scores WHERE market_opportunity_id = mo.id ORDER BY scored_at DESC LIMIT 1) DESC) as rank
FROM market_opportunities mo
WHERE mo.is_active = TRUE
ORDER BY score DESC
LIMIT 20;

-- Get concept with full validation data
SELECT
  c.id,
  c.title,
  c.summary,
  mo.target_market,
  (SELECT composite_score FROM concept_scores WHERE concept_id = c.id ORDER BY scored_at DESC LIMIT 1) as concept_score,
  v.verdict,
  v.confidence,
  v.tam_estimate,
  v.sam_estimate,
  v.ltv_cac_ratio,
  v.gross_margin_percent
FROM concepts c
LEFT JOIN market_opportunities mo ON c.market_opportunity_id = mo.id
LEFT JOIN validations v ON c.id = v.concept_id AND v.validation_phase = 'synthesis'
WHERE c.selected_for_validation = TRUE
ORDER BY concept_score DESC;

-- Get pipeline dashboard: current state of all active items
SELECT
  pi.id,
  CASE pi.item_type
    WHEN 'opportunity' THEN mo.title
    WHEN 'concept' THEN c.title
    ELSE 'Unknown'
  END as title,
  pi.current_phase,
  pi.current_step,
  pi.status,
  pi.entered_phase_at,
  pi.last_gate_decision,
  pi.last_gate_at
FROM pipeline_items pi
LEFT JOIN market_opportunities mo ON pi.market_opportunity_id = mo.id
LEFT JOIN concepts c ON pi.concept_id = c.id
WHERE pi.current_phase NOT IN ('rejected', 'archived')
ORDER BY pi.entered_phase_at DESC;

-- Get agent execution summary
SELECT
  agent_name,
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_runs,
  AVG(execution_duration_seconds) as avg_duration_seconds,
  SUM(cost_usd) as total_cost_usd,
  MAX(started_at) as last_run_at
FROM agent_runs
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY agent_name
ORDER BY total_runs DESC;
```

---

## 11. Implementation Summary

**To set up the complete data layer:**

1. **Create Supabase project** — Start at supabase.com
2. **Run migrations** — Apply the SQL schema using Supabase CLI or dashboard
3. **Configure RLS** — Set up role definitions and policies
4. **Enable Realtime** — Activate realtime on key tables (pipeline_items, agent_runs, etc.)
5. **Create Edge Functions** — Deploy webhook handlers and schedulers
6. **Configure Storage** — Set up blueprint and report buckets with access policies
7. **Seed development data** — Insert sample sources and opportunities
8. **Test connections** — Verify agents and UI can read/write correctly

**Critical access patterns for each component:**

| Component | Primary Query | Needs Realtime | Storage |
|-----------|---------------|----------------|---------|
| Source Scanner | Insert content_items | No | Supabase DB |
| Signal Detector | Read content_items, insert signals | No | Supabase DB |
| Concept Generator | Read market_opportunities, insert concepts | No | Supabase DB |
| Pipeline Orchestrator | Read/update pipeline_items, insert agent_runs | Yes | Supabase DB |
| Review Dashboard | Read all tables, insert annotations/gate decisions | Yes | Supabase DB |
| Blueprint Packager | Read validations, insert blueprints, write PDF | Yes | Supabase DB + Storage |

Every agent and service authenticates via Supabase (service role or scoped token), reads inputs from the database, writes outputs durably, logs execution in agent_runs, and provides the orchestrator visibility into state. The database is the single source of truth for the entire platform.
