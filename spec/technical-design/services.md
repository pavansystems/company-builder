# Company Builder — Technical Design: Services

This document describes the technical architecture for building service-type components in the Company Builder pipeline. Services differ fundamentally from agents: they are long-running, stateful, event-driven systems that orchestrate work, enforce gates, publish results, and collect feedback—rather than reasoning through a single LLM call.

This guide covers three core services:
1. **Pipeline Orchestrator** — State machine for tracking ideas through phases
2. **Watchlist Publisher** — Event-driven service for publishing Phase 0 results
3. **Feedback Loop** — Service for capturing outcomes and tuning scoring models

---

## 1. Service Architecture Pattern

### 1.1 How Services Differ from Agents

| Aspect | Agent | Service |
|--------|-------|---------|
| **Invocation** | Single LLM call per invocation | Continuously running or event-triggered |
| **State** | Stateless; reasoning contained in prompt | Stateful; maintains persistent state across invocations |
| **Execution Model** | Synchronous or long-polling | Event-driven (pub/sub), scheduled (cron), or webhook-based |
| **Responsibility** | Answer one question or complete one task | Manage a workflow, enforce rules, coordinate multiple agents |
| **Data Flow** | Input → Reasoning → Output | Input event → Query state → Transform state → Trigger downstream → Persist |
| **Failure Handling** | Retry with fresh context | Idempotent transactions, dead-letter queues, state recovery |
| **Scaling** | Stateless (horizontal easy) | Stateful (requires careful coordination) |

**Services orchestrate; agents execute.**

### 1.2 Standard Service Structure

Every service follows this architecture:

```
┌─────────────────────────────────────────────────────────┐
│                     External World                       │
│  (Events, Webhooks, Scheduled Tasks, Manual Triggers)    │
└──────────────┬──────────────────────────────────────────┘
               │
        ┌──────▼─────────┐
        │   Trigger      │
        │   Handler      │
        └──────┬─────────┘
               │
        ┌──────▼──────────────────────┐
        │  Load Current State from DB  │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │  State Transition Logic      │
        │  (Enforcement, Validation)   │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │  Trigger Downstream Events   │
        │  (Call Agents, Publish, etc) │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │  Persist New State to DB     │
        │  (Atomic Transaction)        │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │  Event Publishing            │
        │  (Supabase Realtime, etc)    │
        └──────────────────────────────┘
```

**Key principles:**
- **Single source of truth:** State lives in Supabase (PostgreSQL)
- **Event-driven:** Services react to database changes, webhooks, or scheduled tasks
- **Atomic transactions:** State changes and downstream triggers happen together
- **Idempotent:** Re-running the same input produces the same result

### 1.3 Running Services on Vercel

Vercel is serverless (stateless functions), but services need persistent state. Here's the pattern:

**Option A: Vercel Functions + Supabase State** (Recommended)
- Service logic runs in Vercel serverless functions
- State stored in Supabase PostgreSQL
- Triggered by: Vercel cron jobs, HTTP webhooks, or polling
- **Best for:** Orchestration, gates, publishing

**Option B: Supabase pg_cron** (For scheduled tasks)
- PostgreSQL triggers and stored procedures run scheduled jobs
- Minimal external compute; SQL-based automation
- **Best for:** Periodic operations (daily scans, batch processing)

**Option C: Hybrid**
- Vercel functions handle complex logic, coordination
- Supabase triggers handle reactive updates within the database
- **Best for:** Pipeline orchestrator (complex state machine) + event reactions

We use **Option C (Hybrid)** for Company Builder:
- Vercel functions for the orchestrator (decision-making, triggering agents)
- Supabase triggers for reactive updates (gate transitions, feedback collection)
- Vercel cron for scheduled batch operations (Phase 0 scanning)

---

## 2. Pipeline Orchestrator Design

The pipeline orchestrator is the control plane of Company Builder. It manages state machines for each idea flowing through the pipeline, enforces gates, triggers agents, and ensures proper sequencing.

### 2.1 Core Responsibility

The orchestrator:
1. **Tracks state** — Each opportunity/concept/validated idea has a current phase, step, and status
2. **Enforces gates** — Blocks advancement until prerequisites are met or human approval is given
3. **Triggers agents** — Calls the next agent in the pipeline when ready
4. **Handles failures** — Retries, escalates, or rolls back on error
5. **Manages concurrency** — Multiple ideas moving through phases simultaneously
6. **Provides visibility** — Dashboard shows all active pipeline items and their state

### 2.2 Data Model: Pipeline State Machine

Every item in the pipeline has a state graph:

```sql
-- Core tables
CREATE TABLE pipeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  item_type VARCHAR(50) NOT NULL, -- 'opportunity', 'concept', 'validation'
  item_id UUID NOT NULL, -- FK to opportunities/concepts/validations table

  -- State machine
  current_phase INT NOT NULL, -- 0=Discovery, 1=Ideation, 2=Validation, 3=Blueprint
  current_step INT NOT NULL, -- 0.1, 0.2, ... 3.6
  status VARCHAR(50) NOT NULL, -- 'pending', 'in_progress', 'completed', 'blocked', 'failed', 'approved', 'rejected'

  -- Timing
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Metadata
  metadata JSONB DEFAULT '{}', -- agent-specific context
  error_log JSONB DEFAULT '[]', -- history of failures

  -- Gates
  gate_status VARCHAR(50), -- NULL (not at gate), 'pending_auto', 'pending_human', 'approved', 'rejected'
  gate_reviewed_by UUID, -- human reviewer user_id
  gate_reviewed_at TIMESTAMP,
  gate_notes TEXT,

  -- Traceability
  parent_item_id UUID, -- if this was spawned from another item (concept from opportunity)
  agent_run_id VARCHAR(255), -- link to the agent execution logs

  created_by UUID NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(item_type, item_id)
);

-- Event log for audit trail
CREATE TABLE pipeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES pipeline_items(id),

  event_type VARCHAR(100) NOT NULL, -- 'state_changed', 'gate_evaluated', 'agent_triggered', 'agent_completed', 'human_override', 'error'
  old_status VARCHAR(50),
  new_status VARCHAR(50),

  payload JSONB, -- event-specific data
  triggered_by UUID, -- user_id or NULL for system
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (item_id) REFERENCES pipeline_items(id)
);

-- Gate rules: configurable thresholds and conditions
CREATE TABLE gate_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  phase_from INT NOT NULL,
  phase_to INT NOT NULL,

  -- Auto-pass criteria
  auto_pass_condition JSONB NOT NULL, -- {"min_score": 7, "confidence": 0.8}
  auto_review_condition JSONB, -- conditions that trigger human review instead of auto-pass

  -- Human review requirements
  requires_human_review BOOLEAN DEFAULT FALSE,
  min_human_reviewers INT DEFAULT 1,

  created_at TIMESTAMP,
  updated_by UUID,
  updated_at TIMESTAMP
);
```

**State diagram for Phase 0 → Phase 1:**

```
[Phase 0: Discovery]
       ↓
  Opportunity scored (0.4)
       ↓
  [Status: completed]
       ↓
  Gate evaluation (0.5)
       ├─→ [Status: approved] → Auto-advance
       ├─→ [Status: pending_human] → Human review
       └─→ [Status: rejected] → Archive
       ↓
[Phase 1: Ideation begins]
  Landscape analysis (1.1)
  ...
```

### 2.3 Triggering Agents: HTTP Calls from Vercel Functions

When an item is ready to move to the next step, the orchestrator triggers the corresponding agent.

**Pattern:**

```typescript
// /api/orchestrator/trigger-next-agent
// Called when an item completes its current step and is ready for the next

async function triggerNextAgent(itemId: UUID): Promise<AgentRunId> {
  // 1. Load current state
  const item = await supabase
    .from('pipeline_items')
    .select('*')
    .eq('id', itemId)
    .single();

  const { current_phase, current_step, item_type } = item.data;

  // 2. Determine next step
  const nextStep = getNextStep(current_phase, current_step);
  const agentName = stepToAgentName(nextStep); // e.g., 'landscape-analyst'

  // 3. Load input data for the agent
  const inputData = await loadAgentInputs(itemId, agentName);

  // 4. Call the agent function
  const agentRunId = await callAgentFunction(agentName, inputData);

  // 5. Update orchestrator state to 'in_progress'
  await supabase
    .from('pipeline_items')
    .update({
      status: 'in_progress',
      started_at: new Date(),
      agent_run_id: agentRunId
    })
    .eq('id', itemId);

  // 6. Publish event
  await supabase.from('pipeline_events').insert({
    item_id: itemId,
    event_type: 'agent_triggered',
    new_status: 'in_progress',
    payload: { agent: agentName, agentRunId }
  });

  return agentRunId;
}
```

**Agent completion webhook:**

```typescript
// /api/webhooks/agent-complete
// Called by the agent when it finishes (or called by our polling loop)

async function handleAgentCompletion(payload: {
  agentRunId: string;
  status: 'success' | 'failure';
  result?: any;
  error?: string;
}): Promise<void> {
  // 1. Find the pipeline item
  const item = await supabase
    .from('pipeline_items')
    .select('*')
    .eq('agent_run_id', payload.agentRunId)
    .single();

  if (!item.data) {
    throw new Error(`No pipeline item for agent run ${payload.agentRunId}`);
  }

  const itemId = item.data.id;

  if (payload.status === 'failure') {
    // Handle failure
    await handleAgentFailure(itemId, payload.error);
    return;
  }

  // 2. Store the agent output in the data store
  await saveAgentOutput(itemId, payload.result);

  // 3. Determine next action: advance to next step or gate?
  const { nextStep, isAtGate } = getNextAction(item.data.current_phase, item.data.current_step);

  if (isAtGate) {
    // Evaluate the gate
    await evaluateGate(itemId, nextStep);
  } else {
    // Auto-advance: update state and trigger next agent
    await supabase
      .from('pipeline_items')
      .update({
        current_step: nextStep,
        status: 'pending'
      })
      .eq('id', itemId);

    // Trigger next agent
    await triggerNextAgent(itemId);
  }

  // 4. Publish event
  await supabase.from('pipeline_events').insert({
    item_id: itemId,
    event_type: 'agent_completed',
    payload: { nextStep, isAtGate }
  });
}
```

### 2.4 Gate Enforcement Logic

Gates are explicit approval points between phases. They can be automatic (based on scoring rules) or manual (human review).

```typescript
// Gate evaluation logic

async function evaluateGate(itemId: UUID, gatePhase: number): Promise<void> {
  // 1. Load the item and its outputs
  const item = await supabase
    .from('pipeline_items')
    .select('*')
    .eq('id', itemId)
    .single();

  // 2. Load the gate rules for this phase transition
  const [fromPhase, toPhase] = getPhaseTransition(gatePhase);
  const gateRule = await supabase
    .from('gate_rules')
    .select('*')
    .eq('phase_from', fromPhase)
    .eq('phase_to', toPhase)
    .single();

  // 3. Get the outputs from the previous step (e.g., opportunity score)
  const outputs = await loadStepOutputs(itemId);

  // 4. Evaluate auto-pass condition
  const meetsAutoPass = evaluateCondition(
    gateRule.data.auto_pass_condition,
    outputs
  );

  if (meetsAutoPass) {
    // Auto-approve
    await approveAtGate(itemId, 'auto', null, 'Auto-approved by gate rule');
    return;
  }

  // 5. Check if human review is required
  const meetsAutoReview = evaluateCondition(
    gateRule.data.auto_review_condition,
    outputs
  );

  if (meetsAutoReview || gateRule.data.requires_human_review) {
    // Flag for human review
    await supabase
      .from('pipeline_items')
      .update({
        status: 'pending_human',
        gate_status: 'pending_human'
      })
      .eq('id', itemId);

    // Notify review dashboard
    await publishToRealtimeChannel(`gates:pending`, {
      itemId,
      fromPhase,
      toPhase,
      outputs
    });

    return;
  }

  // 6. Default: reject
  await rejectAtGate(
    itemId,
    'auto',
    null,
    'Did not meet auto-pass or review criteria'
  );
}

// Approve at gate (can be manual or automatic)
async function approveAtGate(
  itemId: UUID,
  approvalType: 'auto' | 'human',
  reviewerId: UUID | null,
  notes: string
): Promise<void> {
  const { current_phase, current_step } = await getItem(itemId);
  const nextPhase = current_phase + 1;
  const nextStep = getFirstStepOfPhase(nextPhase);

  await supabase
    .from('pipeline_items')
    .update({
      status: 'approved',
      gate_status: 'approved',
      current_phase: nextPhase,
      current_step: nextStep,
      gate_reviewed_by: reviewerId,
      gate_reviewed_at: new Date(),
      gate_notes: notes
    })
    .eq('id', itemId);

  // Trigger the first agent of the new phase
  await triggerNextAgent(itemId);

  // Publish event
  await supabase.from('pipeline_events').insert({
    item_id: itemId,
    event_type: 'gate_evaluated',
    new_status: 'approved',
    payload: { approvalType, reviewerId, notes }
  });
}

// Reject at gate
async function rejectAtGate(
  itemId: UUID,
  rejectionType: 'auto' | 'human',
  reviewerId: UUID | null,
  notes: string
): Promise<void> {
  await supabase
    .from('pipeline_items')
    .update({
      status: 'rejected',
      gate_status: 'rejected',
      gate_reviewed_by: reviewerId,
      gate_reviewed_at: new Date(),
      gate_notes: notes
    })
    .eq('id', itemId);

  // Archive this item
  await supabase
    .from('pipeline_items')
    .update({ archived: true })
    .eq('id', itemId);

  // Publish event
  await supabase.from('pipeline_events').insert({
    item_id: itemId,
    event_type: 'gate_evaluated',
    new_status: 'rejected',
    payload: { rejectionType, reviewerId, notes }
  });
}
```

### 2.5 Handling Failures and Retries

Agents can fail (API errors, timeouts, invalid outputs). The orchestrator must handle retries gracefully.

```typescript
async function handleAgentFailure(
  itemId: UUID,
  errorMessage: string
): Promise<void> {
  // 1. Load current retry count
  const item = await getItem(itemId);
  const retryCount = (item.error_log || []).filter(
    e => e.type === 'agent_failure'
  ).length;

  const maxRetries = 3;

  if (retryCount < maxRetries) {
    // 2. Retry with exponential backoff
    const delayMs = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s

    // Schedule a retry
    await createScheduledTask({
      item_id: itemId,
      task_type: 'retry_agent',
      scheduled_for: new Date(Date.now() + delayMs)
    });

    // Log the failure
    const errorLog = item.error_log || [];
    errorLog.push({
      type: 'agent_failure',
      message: errorMessage,
      retryCount: retryCount + 1,
      timestamp: new Date()
    });

    await supabase
      .from('pipeline_items')
      .update({
        status: 'pending',
        error_log: errorLog
      })
      .eq('id', itemId);

    // Publish event
    await supabase.from('pipeline_events').insert({
      item_id: itemId,
      event_type: 'error',
      payload: { error: errorMessage, retrying: true, retryCount: retryCount + 1 }
    });
  } else {
    // 3. Max retries exceeded: escalate
    await supabase
      .from('pipeline_items')
      .update({
        status: 'blocked',
        error_log: (item.error_log || []).concat({
          type: 'agent_failure_max_retries',
          message: errorMessage,
          timestamp: new Date()
        })
      })
      .eq('id', itemId);

    // Flag for human review
    await publishToRealtimeChannel('alerts:blocked_items', {
      itemId,
      reason: 'Agent failed after max retries'
    });
  }
}
```

### 2.6 Handling Concurrency

Multiple ideas flow through the pipeline simultaneously. The orchestrator must ensure no race conditions or double-processing.

**Strategy: Optimistic locking with version numbers**

```sql
ALTER TABLE pipeline_items ADD COLUMN version INT DEFAULT 1;

-- Update with version check (CAS: Compare-And-Set)
UPDATE pipeline_items
SET status = 'in_progress', version = version + 1
WHERE id = $1 AND version = $2
RETURNING *;
```

In code:

```typescript
async function transitionState(
  itemId: UUID,
  fromStatus: string,
  toStatus: string,
  expectedVersion: number
): Promise<boolean> {
  const result = await supabase
    .from('pipeline_items')
    .update({
      status: toStatus,
      version: expectedVersion + 1
    })
    .eq('id', itemId)
    .eq('status', fromStatus)
    .eq('version', expectedVersion)
    .select()
    .single();

  if (!result.data) {
    // Update failed: version mismatch or status mismatch
    // Likely another process is handling this item
    return false;
  }

  return true;
}

// Usage:
const success = await transitionState(
  itemId,
  'pending',
  'in_progress',
  item.version
);

if (!success) {
  // Another process is already handling this item; exit gracefully
  return;
}

// Proceed with triggering the agent
await triggerNextAgent(itemId);
```

---

## 3. Event System

The event system enables real-time visibility and reactive updates across the pipeline.

### 3.1 Event-Driven Architecture with Supabase Realtime

Services communicate via a publish-subscribe pattern using Supabase Realtime (WebSockets) for the frontend and database triggers for backend reactions.

**Event types:**

```typescript
enum PipelineEventType {
  // Lifecycle events
  ItemCreated = 'item_created',
  StateChanged = 'state_changed',

  // Agent lifecycle
  AgentTriggered = 'agent_triggered',
  AgentCompleted = 'agent_completed',
  AgentFailed = 'agent_failed',

  // Gate events
  GateEvaluated = 'gate_evaluated',
  GatePassed = 'gate_passed',
  GateBlocked = 'gate_blocked',
  HumanReviewRequested = 'human_review_requested',
  HumanOverride = 'human_override',

  // System events
  RetryScheduled = 'retry_scheduled',
  Archived = 'archived',

  // Feedback events
  FeedbackRecorded = 'feedback_recorded'
}

interface PipelineEvent {
  id: UUID;
  itemId: UUID;
  type: PipelineEventType;
  timestamp: ISO8601;
  payload: Record<string, any>;
  triggeredBy?: UUID; // user_id or null for system
}
```

**Publishing events:**

```typescript
async function publishPipelineEvent(event: PipelineEvent): Promise<void> {
  // 1. Persist to event log
  await supabase.from('pipeline_events').insert({
    item_id: event.itemId,
    event_type: event.type,
    payload: event.payload,
    triggered_by: event.triggeredBy,
    created_at: event.timestamp
  });

  // 2. Publish to Realtime channel for real-time subscriptions
  await supabase
    .channel(`pipeline:${event.itemId}`)
    .send('broadcast', {
      event,
      timestamp: event.timestamp
    });

  // 3. Publish to phase-specific channels for dashboards
  const item = await getItem(event.itemId);
  await supabase
    .channel(`phase:${item.current_phase}:events`)
    .send('broadcast', { event });
}
```

**Subscribing to events (client-side):**

```typescript
// React component listening to pipeline updates
useEffect(() => {
  const channel = supabase
    .channel(`pipeline:${itemId}`)
    .on('broadcast', { event: 'state_changed' }, payload => {
      // Update UI with new state
      setItemState(payload.new_state);
    })
    .on('broadcast', { event: 'agent_completed' }, payload => {
      // Show completion notification
      showToast(`Agent completed: ${payload.agent_name}`);
    })
    .subscribe();

  return () => channel.unsubscribe();
}, [itemId]);
```

### 3.2 Dead Letter Queue for Failed Events

Some events fail to process (agent unavailable, downstream service down). Use a DLQ pattern:

```sql
CREATE TABLE event_dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  event_type VARCHAR(100) NOT NULL,
  item_id UUID,
  payload JSONB NOT NULL,

  error_message TEXT,
  failure_count INT DEFAULT 1,
  first_attempt_at TIMESTAMP DEFAULT NOW(),
  last_attempt_at TIMESTAMP DEFAULT NOW(),
  next_retry_at TIMESTAMP,

  status VARCHAR(50) DEFAULT 'pending' -- pending, processing, resolved, discarded
);
```

**DLQ processing:**

```typescript
async function processDLQ(): Promise<void> {
  // Find events due for retry
  const dlqEvents = await supabase
    .from('event_dead_letter_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('next_retry_at', new Date());

  for (const dlqEvent of dlqEvents.data) {
    try {
      // Attempt to process
      await handleEvent(dlqEvent.payload);

      // Mark as resolved
      await supabase
        .from('event_dead_letter_queue')
        .update({ status: 'resolved' })
        .eq('id', dlqEvent.id);
    } catch (error) {
      // Increment failure count and schedule next retry
      const nextRetry = new Date(
        Date.now() + Math.pow(2, dlqEvent.failure_count) * 60000 // exponential backoff
      );

      await supabase
        .from('event_dead_letter_queue')
        .update({
          failure_count: dlqEvent.failure_count + 1,
          last_attempt_at: new Date(),
          next_retry_at: nextRetry,
          error_message: error.message
        })
        .eq('id', dlqEvent.id);
    }
  }
}
```

---

## 4. Scheduling and Cron

### 4.1 Vercel Cron Jobs

For periodic tasks like Phase 0 scanning, use Vercel cron jobs.

**File: `/api/cron/phase-0-scan`**

```typescript
// pages/api/cron/phase-0-scan.ts

export const config = {
  // Run daily at 2 AM UTC
  cron: '0 2 * * *'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify this is a legitimate cron call from Vercel
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Trigger Phase 0 scanning
    await triggerPhase0Scan();

    res.status(200).json({
      status: 'success',
      message: 'Phase 0 scan initiated',
      timestamp: new Date()
    });
  } catch (error) {
    // Log the error
    console.error('Phase 0 scan failed:', error);

    // Alert operators
    await sendAlert({
      level: 'error',
      title: 'Phase 0 Scan Failed',
      message: error.message
    });

    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}

async function triggerPhase0Scan(): Promise<void> {
  // 1. Trigger source-scanner agent
  const scanRunId = await callAgentFunction('source-scanner', {
    // inputs
  });

  // 2. Create orchestration item to track the scan
  await supabase.from('pipeline_items').insert({
    item_type: 'phase0_scan',
    current_phase: 0,
    current_step: 0.1,
    status: 'in_progress',
    agent_run_id: scanRunId
  });
}
```

### 4.2 Supabase pg_cron (Alternative for Pure SQL Tasks)

For simpler scheduled operations (archiving old items, computing statistics), use `pg_cron` directly in Supabase.

```sql
-- Archive completed items older than 30 days
SELECT cron.schedule(
  'archive_old_completed_items',
  '0 3 * * *', -- 3 AM daily
  $$
    UPDATE pipeline_items
    SET archived = true
    WHERE status = 'completed'
      AND completed_at < NOW() - INTERVAL '30 days'
  $$
);

-- Run daily feedback collection
SELECT cron.schedule(
  'collect_daily_feedback',
  '0 4 * * *', -- 4 AM daily
  $$
    INSERT INTO feedback_aggregation (date, phase, metric, value)
    SELECT
      CURRENT_DATE,
      current_phase,
      'items_completed',
      COUNT(*)
    FROM pipeline_items
    WHERE DATE(completed_at) = CURRENT_DATE
    GROUP BY current_phase
  $$
);
```

### 4.3 Monitoring and Alerting

Track cron executions:

```typescript
// Track cron success/failure
export const config = {
  cron: '0 2 * * *'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  const cronName = 'phase-0-scan';

  try {
    await triggerPhase0Scan();

    // Log successful execution
    await supabase.from('cron_execution_log').insert({
      cron_name: cronName,
      status: 'success',
      duration_ms: Date.now() - startTime,
      executed_at: new Date()
    });

    res.status(200).json({ status: 'success' });
  } catch (error) {
    // Log failure
    await supabase.from('cron_execution_log').insert({
      cron_name: cronName,
      status: 'failed',
      error_message: error.message,
      duration_ms: Date.now() - startTime,
      executed_at: new Date()
    });

    res.status(500).json({ status: 'error', message: error.message });
  }
}
```

---

## 5. Notification and Publishing

### 5.1 Watchlist Publisher Service

The watchlist-publisher is a service that takes ranked opportunities from Phase 0 and publishes them for human review and Phase 1 consumption.

**Core flow:**

```
Phase 0.4 (Ranking) completes
       ↓
Phase 0.5 Gate evaluation
       ↓
Approved opportunities collected
       ↓
Watchlist Publisher:
  - Aggregate rankings
  - Format for dashboard
  - Generate summaries
  - Publish notifications
```

**Implementation:**

```typescript
async function publishWatchlist(phaseGate0Payload: any): Promise<void> {
  // 1. Collect all recently approved opportunities
  const approvedOpportunities = await supabase
    .from('pipeline_items')
    .select('*')
    .eq('current_phase', 0)
    .eq('status', 'approved')
    .gte('gate_reviewed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // last 7 days
    .order('gate_reviewed_at', { ascending: false });

  // 2. Load full opportunity data
  const opportunities = await Promise.all(
    approvedOpportunities.data.map(async (item) => {
      const oppData = await loadOpportunityData(item.item_id);
      return {
        ...item,
        ...oppData,
        scoringBreakdown: await loadScoringDetails(item.item_id)
      };
    })
  );

  // 3. Rank and format for display
  const watchlist = {
    generatedAt: new Date(),
    totalOpportunities: opportunities.length,
    opportunities: opportunities.sort((a, b) =>
      (b.scoring?.composite_score || 0) - (a.scoring?.composite_score || 0)
    ),
    summary: generateWatchlistSummary(opportunities)
  };

  // 4. Store the published watchlist
  const watchlistId = await supabase
    .from('published_watchlists')
    .insert({
      content: watchlist,
      published_at: new Date(),
      version: getNextWatchlistVersion()
    })
    .select('id')
    .single();

  // 5. Publish notifications
  await publishNotifications(watchlist);

  // 6. Update Realtime for dashboard subscribers
  await supabase
    .channel('watchlist:updates')
    .send('broadcast', {
      type: 'watchlist_published',
      watchlistId: watchlistId.data.id,
      opportunityCount: opportunities.length
    });
}
```

### 5.2 Notification Channels

**Email (SendGrid/Resend):**

```typescript
async function sendWatchlistEmail(recipients: string[]): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: 'watchlist@companybuilder.dev',
    to: recipients,
    subject: 'Weekly Watchlist: New Market Opportunities',
    html: renderWatchlistEmailTemplate({
      opportunities: selectedOpportunities,
      actionUrl: `https://app.companybuilder.dev/watchlist`
    })
  });

  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }
}
```

**Slack webhooks:**

```typescript
async function publishToSlack(watchlist: Watchlist): Promise<void> {
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*New Watchlist Published*\n${watchlist.summary.headline}`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: watchlist.opportunities
          .slice(0, 5)
          .map(opp => `• ${opp.name}: ${opp.scoring.composite_score}/10`)
          .join('\n')
      }
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'View Full Watchlist' },
          url: 'https://app.companybuilder.dev/watchlist'
        }
      ]
    }
  ];

  await slack.chat.postMessage({
    channel: process.env.SLACK_WATCHLIST_CHANNEL,
    blocks
  });
}
```

**In-app notifications (Supabase Realtime):**

```typescript
async function publishInAppNotification(notification: {
  title: string;
  message: string;
  actionUrl?: string;
  userId?: UUID;
}): Promise<void> {
  // Broadcast to Realtime channel
  await supabase
    .channel(`notifications:${notification.userId || 'broadcast'}`)
    .send('broadcast', {
      type: 'notification',
      payload: notification
    });

  // Also store in database for persistence
  await supabase.from('notifications').insert({
    user_id: notification.userId,
    title: notification.title,
    message: notification.message,
    action_url: notification.actionUrl,
    created_at: new Date()
  });
}
```

### 5.3 Webhook Design for External Integrations

Allow downstream systems to subscribe to pipeline events via webhooks.

```sql
CREATE TABLE webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL,

  -- Subscription details
  endpoint_url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- e.g., ['gate_passed', 'agent_completed']

  -- Authentication
  signing_secret TEXT NOT NULL,

  -- Status
  active BOOLEAN DEFAULT true,
  last_delivery_at TIMESTAMP,
  failure_count INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES webhook_subscriptions(id),

  event_id UUID NOT NULL,
  payload JSONB NOT NULL,

  status VARCHAR(50), -- pending, delivered, failed
  response_status_code INT,
  response_body TEXT,

  attempted_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,

  FOREIGN KEY (subscription_id) REFERENCES webhook_subscriptions(id)
);
```

**Webhook dispatch:**

```typescript
async function dispatchWebhooks(event: PipelineEvent): Promise<void> {
  // 1. Find subscriptions interested in this event
  const subscriptions = await supabase
    .from('webhook_subscriptions')
    .select('*')
    .eq('active', true)
    .contains('events', [event.type]); // PostgreSQL array contains

  // 2. For each subscription, queue a delivery
  for (const sub of subscriptions.data) {
    const payload = {
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      data: event.payload
    };

    // Sign the payload
    const signature = signWebhookPayload(
      JSON.stringify(payload),
      sub.signing_secret
    );

    // Queue delivery
    await queueWebhookDelivery({
      subscriptionId: sub.id,
      payload,
      signature
    });
  }
}

async function deliverWebhook(
  delivery: WebhookDelivery,
  subscription: WebhookSubscription
): Promise<void> {
  try {
    const response = await fetch(subscription.endpoint_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': delivery.signature
      },
      body: JSON.stringify(delivery.payload),
      timeout: 30000
    });

    await supabase
      .from('webhook_deliveries')
      .update({
        status: response.ok ? 'delivered' : 'failed',
        response_status_code: response.status,
        response_body: await response.text(),
        delivered_at: response.ok ? new Date() : null
      })
      .eq('id', delivery.id);

    if (!response.ok) {
      await incrementWebhookFailureCount(subscription.id);
    }
  } catch (error) {
    // Network failure; schedule retry
    await supabase
      .from('webhook_deliveries')
      .update({
        status: 'failed',
        response_body: error.message
      })
      .eq('id', delivery.id);

    await incrementWebhookFailureCount(subscription.id);
  }
}

async function incrementWebhookFailureCount(subscriptionId: UUID): Promise<void> {
  const sub = await supabase
    .from('webhook_subscriptions')
    .select('failure_count')
    .eq('id', subscriptionId)
    .single();

  const newCount = (sub.data.failure_count || 0) + 1;

  // Disable if too many failures
  if (newCount > 10) {
    await supabase
      .from('webhook_subscriptions')
      .update({ active: false })
      .eq('id', subscriptionId);
  } else {
    await supabase
      .from('webhook_subscriptions')
      .update({ failure_count: newCount })
      .eq('id', subscriptionId);
  }
}
```

---

## 6. Feedback Loop Design

The feedback loop captures outcomes from later phases and feeds learnings back to improve earlier scoring and classification models.

### 6.1 Feedback Data Collection

At each gate and outcome point, capture structured feedback:

```sql
CREATE TABLE feedback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What we're collecting feedback on
  item_id UUID NOT NULL REFERENCES pipeline_items(id),
  from_phase INT NOT NULL,
  to_phase INT NOT NULL,

  -- The prediction (from earlier phase)
  predicted_score FLOAT,
  predicted_confidence FLOAT,
  predicted_label VARCHAR(100), -- e.g., 'approved', 'rejected'

  -- The outcome (ground truth from later phase)
  actual_outcome VARCHAR(100), -- e.g., 'validated', 'failed_validation', 'still_in_progress'
  actual_value FLOAT, -- e.g., final market size if available

  -- Metadata for analysis
  feedback_type VARCHAR(50), -- 'gate_outcome', 'phase_outcome', 'manual_annotation'
  source_user_id UUID, -- who provided feedback (for manual annotations)

  created_at TIMESTAMP DEFAULT NOW()
);

-- Example: Capture Phase 1 scores vs Phase 2 outcomes
-- INSERT INTO feedback_events (item_id, from_phase, to_phase, predicted_score, actual_outcome)
-- SELECT
--   item_id,
--   1, 2,
--   (data->'scoring'->>'composite_score')::float,
--   CASE
--     WHEN (data->'validation'->>'verdict') = 'validated' THEN 'validated'
--     ELSE 'rejected'
--   END
-- FROM pipeline_items
-- WHERE current_phase >= 2;
```

### 6.2 Statistical Analysis: What Works?

Analyze which Phase 0/1 signals and scores correlate with successful Phase 2 validation:

```typescript
async function analyzePhase0to2Success(): Promise<CorrelationAnalysis> {
  // 1. Load feedback data
  const feedback = await supabase
    .from('feedback_events')
    .select('*')
    .eq('from_phase', 0)
    .eq('to_phase', 2);

  // 2. Compute success rate by score bucket
  const successRates = bucketByScore(feedback.data, [0, 3, 5, 7, 10]);

  // 3. Identify which Phase 0 signals correlate with success
  const signalCorrelations = await computeSignalCorrelations(feedback.data);

  // 4. Analyze false positives and false negatives
  const falsePositives = feedback.data.filter(
    f => f.predicted_score > 7 && !f.actual_outcome.includes('success')
  );

  const falseNegatives = feedback.data.filter(
    f => f.predicted_score < 5 && f.actual_outcome.includes('success')
  );

  return {
    successRateByScore: successRates,
    signalCorrelations,
    falsePositiveRate: falsePositives.length / feedback.data.length,
    falseNegativeRate: falseNegatives.length / feedback.data.length,
    recommendedAdjustments: generateRecommendations({
      successRates,
      signalCorrelations,
      falsePositives,
      falseNegatives
    })
  };
}
```

### 6.3 Tuning Scoring Models

Use feedback to automatically adjust scoring models:

```typescript
async function autotuneScores(): Promise<void> {
  // 1. Run statistical analysis
  const analysis = await analyzePhase0to2Success();

  // 2. For each signal detector, update weights
  for (const signal of analysis.signalCorrelations) {
    if (signal.correlation > 0.7) {
      // Strong positive correlation: increase weight
      await supabase
        .from('signal_weights')
        .update({
          weight: signal.currentWeight * 1.1,
          tuned_at: new Date(),
          tuning_reason: 'High correlation with Phase 2 success'
        })
        .eq('signal_type', signal.type);
    } else if (signal.correlation < 0.3) {
      // Weak correlation: decrease weight
      await supabase
        .from('signal_weights')
        .update({
          weight: Math.max(signal.currentWeight * 0.9, 0.1),
          tuned_at: new Date(),
          tuning_reason: 'Low correlation with Phase 2 success'
        })
        .eq('signal_type', signal.type);
    }
  }

  // 3. Adjust gate thresholds based on false positive/negative rates
  if (analysis.falsePositiveRate > 0.2) {
    // Too many incorrect approvals: raise threshold
    await supabase
      .from('gate_rules')
      .update({
        auto_pass_condition: {
          min_score: 8 // increased from 7
        }
      })
      .eq('phase_from', 0)
      .eq('phase_to', 1);
  }

  if (analysis.falseNegativeRate > 0.15) {
    // Too many missed opportunities: lower threshold
    await supabase
      .from('gate_rules')
      .update({
        auto_pass_condition: {
          min_score: 6 // lowered from 7
        }
      })
      .eq('phase_from', 0)
      .eq('phase_to', 1);
  }

  // 4. Log the tuning event
  await supabase.from('model_tuning_log').insert({
    model_name: 'phase_0_opportunity_ranking',
    changes: analysis.recommendedAdjustments,
    tuned_at: new Date(),
    metrics_before: analysis.metrics_before,
    metrics_after: analysis.metrics_after
  });
}
```

---

## 7. Code Structure

### 7.1 Recommended File Layout

```
/api
  /orchestrator
    /[orchestrator functions]
    transition.ts       # State machine logic
    trigger-agent.ts    # Agent triggering
    evaluate-gate.ts    # Gate logic
    handle-failure.ts   # Failure recovery
  /webhooks
    /agent-complete.ts  # Agent completion webhook
    /gate-override.ts   # Human gate override
  /cron
    /phase-0-scan.ts    # Daily Phase 0 trigger
    /dlq-processor.ts   # DLQ retry processor

/lib
  /services
    orchestrator.ts     # Orchestrator service class
    events.ts           # Event publishing utilities
    notifications.ts    # Email, Slack, in-app
    feedback.ts         # Feedback collection and analysis
    watchlist.ts        # Watchlist publisher
  /utils
    state-machine.ts    # State transitions, validation
    db.ts              # Database utilities
    logging.ts         # Structured logging
    retries.ts         # Retry logic
  /db
    schema.sql         # SQL schema definition
    migrations/        # Schema versions

/types
  pipeline.ts         # TypeScript types for state, events, etc.
```

### 7.2 Shared Service Utilities

```typescript
// lib/services/base-service.ts

export abstract class BaseService {
  protected supabase: SupabaseClient;
  protected logger: Logger;

  constructor(supabase: SupabaseClient, logger: Logger) {
    this.supabase = supabase;
    this.logger = logger;
  }

  // Common patterns for all services

  async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.logger.error(`${context} failed`, { error });
      throw error;
    }
  }

  async withTransaction<T>(
    operation: (tx: SupabaseClient) => Promise<T>
  ): Promise<T> {
    // Supabase doesn't have native transactions; use Postgres directly
    const client = createClient(process.env.DATABASE_URL);
    await client.query('BEGIN');
    try {
      const result = await operation(this.supabase);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    backoffMs: number = 1000
  ): Promise<T> {
    let lastError: Error;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await delay(backoffMs * Math.pow(2, attempt - 1));
        }
      }
    }
    throw lastError;
  }
}
```

### 7.3 Configuration and Environment Management

```typescript
// lib/config.ts

export interface ServiceConfig {
  env: 'development' | 'staging' | 'production';
  supabaseUrl: string;
  supabaseKey: string;
  maxAgentRetries: number;
  agentTimeoutMs: number;
  gateScoringThreshold: number;
  notificationChannels: {
    email: boolean;
    slack: boolean;
    inApp: boolean;
  };
}

export function loadConfig(): ServiceConfig {
  return {
    env: (process.env.NODE_ENV as any) || 'development',
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_ANON_KEY!,
    maxAgentRetries: parseInt(process.env.MAX_AGENT_RETRIES || '3', 10),
    agentTimeoutMs: parseInt(process.env.AGENT_TIMEOUT_MS || '600000', 10), // 10 min
    gateScoringThreshold: parseFloat(process.env.GATE_THRESHOLD || '7.0'),
    notificationChannels: {
      email: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
      slack: process.env.ENABLE_SLACK_NOTIFICATIONS === 'true',
      inApp: process.env.ENABLE_IN_APP_NOTIFICATIONS === 'true'
    }
  };
}

// Usage
const config = loadConfig();
const maxRetries = config.maxAgentRetries;
```

---

## 8. Reference Implementation: Pipeline Orchestrator

Below is a complete TypeScript implementation of the orchestrator showing state transitions, agent triggering, and gate enforcement.

```typescript
// lib/services/orchestrator.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { Logger } from '../utils/logging';
import { BaseService } from './base-service';

interface PipelineItem {
  id: string;
  item_type: string;
  current_phase: number;
  current_step: number;
  status: string;
  metadata: Record<string, any>;
  error_log: Array<{ type: string; message: string; timestamp: string }>;
  version: number;
  agent_run_id?: string;
}

interface GateRule {
  phase_from: number;
  phase_to: number;
  auto_pass_condition: Record<string, any>;
  auto_review_condition?: Record<string, any>;
  requires_human_review: boolean;
}

export class PipelineOrchestrator extends BaseService {
  private agentTimeoutMs: number;
  private maxRetries: number;

  constructor(
    supabase: SupabaseClient,
    logger: Logger,
    agentTimeoutMs: number = 600000,
    maxRetries: number = 3
  ) {
    super(supabase, logger);
    this.agentTimeoutMs = agentTimeoutMs;
    this.maxRetries = maxRetries;
  }

  // ============================================
  // Main orchestration entry points
  // ============================================

  async initializeItem(
    itemType: string,
    itemId: string,
    initialPhase: number = 0,
    initialStep: number = 0.1,
    createdBy: string
  ): Promise<PipelineItem> {
    return this.withErrorHandling(async () => {
      const { data, error } = await this.supabase
        .from('pipeline_items')
        .insert({
          item_type: itemType,
          item_id: itemId,
          current_phase: initialPhase,
          current_step: initialStep,
          status: 'pending',
          created_by: createdBy,
          created_at: new Date(),
          version: 1
        })
        .select()
        .single();

      if (error) throw error;

      // Publish initialization event
      await this.publishEvent({
        itemId: data.id,
        type: 'item_created',
        payload: {
          itemType,
          startingPhase: initialPhase,
          startingStep: initialStep
        }
      });

      return data as PipelineItem;
    }, `Initialize item ${itemId}`);
  }

  async processNextStep(itemId: string): Promise<void> {
    return this.withErrorHandling(async () => {
      // 1. Load current item state with optimistic locking
      const item = await this.loadItem(itemId);
      if (!item) throw new Error(`Item not found: ${itemId}`);

      // 2. Determine next action: agent or gate?
      const { nextStep, isAtGate } = this.getNextAction(
        item.current_phase,
        item.current_step
      );

      if (isAtGate) {
        // Evaluate gate
        await this.evaluateGate(itemId, item.current_phase);
      } else {
        // Trigger next agent
        await this.triggerAgent(itemId, nextStep);
      }
    }, `Process next step for item ${itemId}`);
  }

  async handleAgentCompletion(
    agentRunId: string,
    success: boolean,
    result?: any,
    error?: string
  ): Promise<void> {
    return this.withErrorHandling(async () => {
      // 1. Find the item
      const { data: items } = await this.supabase
        .from('pipeline_items')
        .select('*')
        .eq('agent_run_id', agentRunId);

      if (!items || items.length === 0) {
        throw new Error(`No item found for agent run: ${agentRunId}`);
      }

      const itemId = items[0].id;

      if (!success) {
        await this.handleAgentFailure(itemId, error);
        return;
      }

      // 2. Store agent output
      await this.storeAgentOutput(itemId, result);

      // 3. Move to next step
      const item = await this.loadItem(itemId);
      const { nextStep, isAtGate } = this.getNextAction(
        item.current_phase,
        item.current_step
      );

      // Update state: mark current step complete, move to next
      const success_update = await this.transitionState(
        itemId,
        'in_progress',
        isAtGate ? 'at_gate' : 'pending',
        item.version,
        { current_step: nextStep }
      );

      if (!success_update) {
        this.logger.warn(`Concurrent update detected for item ${itemId}`);
        return;
      }

      // Publish event
      await this.publishEvent({
        itemId,
        type: 'agent_completed',
        payload: {
          previousStep: item.current_step,
          nextStep,
          isAtGate,
          result: result ? { type: typeof result, size: JSON.stringify(result).length } : undefined
        }
      });

      // If at gate, evaluate it
      if (isAtGate) {
        await this.evaluateGate(itemId, item.current_phase);
      }
    }, `Handle agent completion for run ${agentRunId}`);
  }

  // ============================================
  // State machine logic
  // ============================================

  private getNextAction(phase: number, step: number): {
    nextStep: number;
    isAtGate: boolean;
  } {
    // Define pipeline structure: which steps lead to gates
    const pipelineStructure = {
      0: { steps: [0.1, 0.2, 0.3, 0.4], gateAfter: 0.4 },
      1: { steps: [1.1, 1.2, 1.3, 1.4], gateAfter: 1.4 },
      2: { steps: [2.1, 2.2, 2.3, 2.4, 2.5, 2.6], gateAfter: 2.6 },
      3: { steps: [3.1, 3.2, 3.3, 3.4, 3.5, 3.6], gateAfter: 3.6 }
    };

    const phaseDef = pipelineStructure[phase];
    const currentIndex = phaseDef.steps.indexOf(step);

    if (currentIndex === -1) {
      throw new Error(`Invalid step ${step} for phase ${phase}`);
    }

    const nextIndex = currentIndex + 1;
    const isAtGate = nextIndex >= phaseDef.steps.length;

    if (isAtGate) {
      return { nextStep: phaseDef.gateAfter, isAtGate: true };
    }

    return { nextStep: phaseDef.steps[nextIndex], isAtGate: false };
  }

  private async transitionState(
    itemId: string,
    fromStatus: string,
    toStatus: string,
    expectedVersion: number,
    updates?: Record<string, any>
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('pipeline_items')
      .update({
        status: toStatus,
        version: expectedVersion + 1,
        ...updates,
        updated_at: new Date()
      })
      .eq('id', itemId)
      .eq('status', fromStatus)
      .eq('version', expectedVersion)
      .select()
      .single();

    return !!data && !error;
  }

  // ============================================
  // Agent triggering
  // ============================================

  private async triggerAgent(itemId: string, step: number): Promise<void> {
    const item = await this.loadItem(itemId);

    // 1. Load input data for the agent
    const agentName = this.stepToAgentName(step);
    const inputData = await this.loadAgentInputs(itemId, agentName);

    // 2. Call the agent (via HTTP or direct import)
    const agentRunId = await this.callAgent(agentName, inputData);

    // 3. Update state to in_progress with version check
    const success = await this.transitionState(
      itemId,
      item.status,
      'in_progress',
      item.version,
      {
        agent_run_id: agentRunId,
        started_at: new Date()
      }
    );

    if (!success) {
      throw new Error(`Failed to transition item ${itemId} to in_progress (concurrent update)`);
    }

    // 4. Publish event
    await this.publishEvent({
      itemId,
      type: 'agent_triggered',
      payload: {
        agent: agentName,
        step,
        agentRunId,
        inputs: { type: typeof inputData, size: JSON.stringify(inputData).length }
      }
    });

    // 5. Start timeout monitoring
    this.startAgentTimeoutMonitor(itemId, agentRunId);
  }

  private startAgentTimeoutMonitor(itemId: string, agentRunId: string): void {
    // Schedule a timeout check
    setTimeout(async () => {
      const item = await this.loadItem(itemId);
      if (item.status === 'in_progress' && item.agent_run_id === agentRunId) {
        // Agent still running; check if it's actually stuck
        const isStuck = await this.isAgentStuck(agentRunId);
        if (isStuck) {
          await this.handleAgentFailure(itemId, `Agent timeout after ${this.agentTimeoutMs}ms`);
        }
      }
    }, this.agentTimeoutMs);
  }

  private async isAgentStuck(agentRunId: string): Promise<boolean> {
    // Query agent execution status (implementation depends on agent platform)
    // For now, assume stuck if we can't reach the agent API
    try {
      const response = await fetch(
        `${process.env.AGENT_API_URL}/runs/${agentRunId}`,
        {
          headers: { Authorization: `Bearer ${process.env.AGENT_API_KEY}` }
        }
      );
      const data = await response.json();
      return data.status === 'running' && Date.now() - data.started_at > this.agentTimeoutMs;
    } catch {
      // Can't reach agent API; assume stuck
      return true;
    }
  }

  private async callAgent(agentName: string, inputs: any): Promise<string> {
    // Call the agent via HTTP endpoint
    const response = await fetch(`${process.env.VERCEL_URL}/api/agents/${agentName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AGENT_SECRET}`
      },
      body: JSON.stringify(inputs)
    });

    if (!response.ok) {
      throw new Error(`Agent call failed: ${response.statusText}`);
    }

    const { run_id } = await response.json();
    return run_id;
  }

  private stepToAgentName(step: number): string {
    const stepToAgent: Record<number, string> = {
      0.1: 'source-scanner',
      0.2: 'signal-detector',
      0.3: 'market-classifier',
      0.4: 'opportunity-ranker',
      1.1: 'landscape-analyst',
      1.2: 'pain-extractor',
      1.3: 'concept-generator',
      1.4: 'concept-scorer',
      2.1: 'market-sizer',
      2.2: 'competitive-analyst',
      2.3: 'customer-validator',
      2.4: 'feasibility-assessor',
      2.5: 'economics-modeler',
      2.6: 'validation-synthesizer',
      3.1: 'business-designer',
      3.2: 'agent-architect',
      3.3: 'gtm-strategist',
      3.4: 'risk-analyst',
      3.5: 'resource-planner',
      3.6: 'blueprint-packager'
    };

    return stepToAgent[step] || `unknown-agent-${step}`;
  }

  // ============================================
  // Gate evaluation
  // ============================================

  private async evaluateGate(itemId: string, currentPhase: number): Promise<void> {
    const item = await this.loadItem(itemId);

    // 1. Get gate rules
    const gateRule = await this.loadGateRule(currentPhase, currentPhase + 1);
    if (!gateRule) {
      throw new Error(`No gate rule defined for phase ${currentPhase} -> ${currentPhase + 1}`);
    }

    // 2. Load evaluation data
    const evaluationData = await this.loadGateEvaluationData(itemId);

    // 3. Evaluate conditions
    const meetsAutoPass = this.evaluateCondition(gateRule.auto_pass_condition, evaluationData);
    const meetsAutoReview = gateRule.auto_review_condition
      ? this.evaluateCondition(gateRule.auto_review_condition, evaluationData)
      : false;

    if (meetsAutoPass) {
      // Auto-approve
      await this.approveAtGate(itemId, 'auto', null, 'Auto-approved by gate rule');
    } else if (meetsAutoReview || gateRule.requires_human_review) {
      // Flag for human review
      await this.requestHumanReview(itemId, evaluationData);
    } else {
      // Reject
      await this.rejectAtGate(itemId, 'auto', null, 'Did not meet auto-pass criteria');
    }
  }

  private evaluateCondition(condition: Record<string, any>, data: Record<string, any>): boolean {
    // Simple condition evaluation: "min_score: 7" checks data.score >= 7
    for (const [key, threshold] of Object.entries(condition)) {
      if (typeof threshold === 'number') {
        const value = this.getNestedValue(data, key);
        if (value === undefined || value < threshold) {
          return false;
        }
      }
    }
    return true;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
  }

  private async approveAtGate(
    itemId: string,
    approvalType: 'auto' | 'human',
    reviewerId: string | null,
    notes: string
  ): Promise<void> {
    const item = await this.loadItem(itemId);

    const nextPhase = item.current_phase + 1;
    const nextStep = this.getFirstStepOfPhase(nextPhase);

    // Transition state
    const success = await this.transitionState(
      itemId,
      'at_gate',
      'approved',
      item.version,
      {
        current_phase: nextPhase,
        current_step: nextStep,
        gate_reviewed_by: reviewerId,
        gate_reviewed_at: new Date(),
        gate_notes: notes
      }
    );

    if (!success) {
      throw new Error(`Concurrent update during gate approval for ${itemId}`);
    }

    // Trigger first agent of new phase
    await this.triggerAgent(itemId, nextStep);

    // Publish event
    await this.publishEvent({
      itemId,
      type: 'gate_passed',
      payload: {
        approvalType,
        reviewerId,
        notes,
        fromPhase: item.current_phase,
        toPhase: nextPhase
      }
    });
  }

  private async rejectAtGate(
    itemId: string,
    rejectionType: 'auto' | 'human',
    reviewerId: string | null,
    notes: string
  ): Promise<void> {
    const item = await this.loadItem(itemId);

    const success = await this.transitionState(
      itemId,
      'at_gate',
      'rejected',
      item.version,
      {
        gate_reviewed_by: reviewerId,
        gate_reviewed_at: new Date(),
        gate_notes: notes,
        archived: true
      }
    );

    if (!success) {
      throw new Error(`Concurrent update during gate rejection for ${itemId}`);
    }

    // Publish event
    await this.publishEvent({
      itemId,
      type: 'gate_blocked',
      payload: {
        rejectionType,
        reviewerId,
        notes
      }
    });
  }

  private async requestHumanReview(
    itemId: string,
    evaluationData: Record<string, any>
  ): Promise<void> {
    const item = await this.loadItem(itemId);

    const success = await this.transitionState(
      itemId,
      'at_gate',
      'pending_human',
      item.version
    );

    if (!success) {
      throw new Error(`Concurrent update during human review request for ${itemId}`);
    }

    // Notify review dashboard and humans
    await this.publishEvent({
      itemId,
      type: 'human_review_requested',
      payload: { evaluationData }
    });

    // Publish to Realtime for instant notification
    await this.supabase
      .channel(`gates:pending`)
      .send('broadcast', {
        type: 'review_requested',
        itemId,
        evaluationData
      });
  }

  // ============================================
  // Failure handling
  // ============================================

  private async handleAgentFailure(itemId: string, errorMessage: string): Promise<void> {
    const item = await this.loadItem(itemId);

    const retryCount = (item.error_log || []).filter(e => e.type === 'agent_failure').length;

    if (retryCount < this.maxRetries) {
      // Schedule retry with exponential backoff
      const delayMs = Math.pow(2, retryCount) * 1000;

      await this.scheduleRetry(itemId, delayMs);

      // Update error log
      const newErrorLog = [
        ...(item.error_log || []),
        {
          type: 'agent_failure',
          message: errorMessage,
          retryNumber: retryCount + 1,
          timestamp: new Date().toISOString()
        }
      ];

      const success = await this.transitionState(
        itemId,
        'in_progress',
        'pending',
        item.version,
        { error_log: newErrorLog }
      );

      if (success) {
        await this.publishEvent({
          itemId,
          type: 'agent_failed',
          payload: {
            error: errorMessage,
            retrying: true,
            retryNumber: retryCount + 1
          }
        });
      }
    } else {
      // Max retries exceeded: escalate
      const newErrorLog = [
        ...(item.error_log || []),
        {
          type: 'agent_failure_max_retries',
          message: errorMessage,
          timestamp: new Date().toISOString()
        }
      ];

      const success = await this.transitionState(
        itemId,
        'in_progress',
        'blocked',
        item.version,
        { error_log: newErrorLog }
      );

      if (success) {
        await this.publishEvent({
          itemId,
          type: 'agent_failed',
          payload: {
            error: errorMessage,
            retrying: false,
            blocked: true
          }
        });

        // Alert operators
        await this.supabase
          .channel('alerts:blocked_items')
          .send('broadcast', {
            type: 'item_blocked',
            itemId,
            reason: 'Agent failed after max retries',
            error: errorMessage
          });
      }
    }
  }

  private async scheduleRetry(itemId: string, delayMs: number): Promise<void> {
    // This would typically use a job queue or scheduled task system
    // For now, we rely on polling (a separate cron job polls for pending retries)
    this.logger.info(`Scheduled retry for item ${itemId} in ${delayMs}ms`);
  }

  // ============================================
  // Utility methods
  // ============================================

  private async loadItem(itemId: string): Promise<PipelineItem> {
    const { data, error } = await this.supabase
      .from('pipeline_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error || !data) throw new Error(`Item not found: ${itemId}`);
    return data as PipelineItem;
  }

  private async loadGateRule(phaseFrom: number, phaseTo: number): Promise<GateRule> {
    const { data } = await this.supabase
      .from('gate_rules')
      .select('*')
      .eq('phase_from', phaseFrom)
      .eq('phase_to', phaseTo)
      .single();
    return data as GateRule;
  }

  private async loadAgentInputs(itemId: string, agentName: string): Promise<any> {
    // Load context data specific to this agent
    // This varies by agent; simplified here
    const item = await this.loadItem(itemId);
    return {
      item_id: itemId,
      item_type: item.item_type,
      phase: item.current_phase,
      step: item.current_step,
      context: item.metadata
    };
  }

  private async loadGateEvaluationData(itemId: string): Promise<Record<string, any>> {
    // Load the outputs from the previous step(s) for gate evaluation
    const item = await this.loadItem(itemId);
    const { data: outputs } = await this.supabase
      .from(`step_outputs`)
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return outputs?.data || {};
  }

  private async storeAgentOutput(itemId: string, result: any): Promise<void> {
    await this.supabase.from('step_outputs').insert({
      item_id: itemId,
      data: result,
      created_at: new Date()
    });
  }

  private async publishEvent(event: {
    itemId: string;
    type: string;
    payload: any;
  }): Promise<void> {
    // Persist event
    await this.supabase.from('pipeline_events').insert({
      item_id: event.itemId,
      event_type: event.type,
      payload: event.payload,
      created_at: new Date()
    });

    // Publish to Realtime
    await this.supabase
      .channel(`pipeline:${event.itemId}`)
      .send('broadcast', event);
  }

  private getFirstStepOfPhase(phase: number): number {
    const firstSteps: Record<number, number> = {
      0: 0.1,
      1: 1.1,
      2: 2.1,
      3: 3.1
    };
    return firstSteps[phase] || 0.1;
  }
}
```

---

## Summary

This technical design document provides a complete blueprint for building service-type components in Company Builder:

1. **Service Architecture** — Services are long-running, stateful, event-driven systems that orchestrate work. They differ fundamentally from agents.

2. **Pipeline Orchestrator** — Manages a state machine for tracking ideas through 4 phases. Triggers agents, enforces gates, handles failures, and manages concurrency.

3. **Event System** — Supabase Realtime provides real-time pub/sub for the frontend and database triggers for backend reactions. Dead letter queue handles failures.

4. **Scheduling & Cron** — Vercel cron jobs for periodic Phase 0 triggers; Supabase pg_cron for simple SQL tasks.

5. **Notification & Publishing** — Watchlist Publisher aggregates and publishes Phase 0 results. Notifications via email (SendGrid/Resend), Slack, and in-app (Realtime). Webhooks for external integrations.

6. **Feedback Loop** — Collects outcomes from later phases, analyzes correlations, and auto-tunes scoring models.

7. **Code Structure** — Recommended file layout, shared service utilities, configuration management.

8. **Reference Implementation** — Complete TypeScript orchestrator showing state transitions, agent triggering, gate enforcement, failure handling, and concurrency control.

The architecture is production-ready: it handles failures gracefully, provides auditability, scales horizontally on Vercel, persists state safely in Supabase, and maintains real-time visibility through events.
