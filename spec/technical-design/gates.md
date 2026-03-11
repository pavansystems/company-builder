# Gates — Technical Design Reference

## Overview

Gates are decision points in the pipeline that determine whether a pipeline item (opportunity, concept, or validation) advances to the next phase, enters human review, or is rejected. Every phase transition has gate logic: Phase 0→1, Phase 1→2, and Phase 2→3.

The **concept-selector (Step 1.5)** is the most explicit gate with dedicated UI and review workflow, but the same gate architecture pattern applies to all three gates.

Gates enforce go/no-go decisions and are the primary mechanism for quality control and human oversight across the pipeline.

---

## 1. Gate Architecture Pattern

### What Is a Gate?

A gate is a function that evaluates a pipeline item against defined criteria and produces one of three outcomes:

- **Advance** — Item meets criteria and moves to the next phase automatically
- **Review** — Item falls in a middle band; human review required before advancement
- **Reject** — Item fails criteria and is archived with rejection rationale

### Gate Types

#### 1. Automatic (Score Threshold)

```
Score >= HIGH_THRESHOLD  → Advance
Score < LOW_THRESHOLD   → Reject
Otherwise               → N/A (not used for this gate type)
```

Used when a single, well-calibrated score is sufficient. Simple and fast.

**Example:** Phase 0 gate using opportunity score.

#### 2. Manual (Human Review)

All items enter a review queue. Reviewers make explicit approve/reject decisions.

**Example:** Manual promotion of opportunities by human curator.

#### 3. Hybrid (Recommended)

```
Score >= HIGH_THRESHOLD  → Advance (auto-approve)
MIDDLE <= Score < HIGH   → Review (human decision required)
Score < LOW_THRESHOLD    → Reject (auto-reject)
```

Balances automation with human oversight. High-confidence decisions proceed fast; borderline cases get review; weak cases are filtered early.

**Example:** Phase 1 gate (concept-selector) using concept score.

### Standard Gate Interface

All gates implement this interface:

```typescript
interface Gate<T> {
  // Evaluate an item and return a decision
  evaluate(item: T): Promise<GateDecision>;

  // Get gate configuration
  getConfig(): GateConfig;

  // Update gate configuration (admin only)
  updateConfig(config: Partial<GateConfig>): Promise<void>;
}

type GateDecision =
  | { status: 'advance' }
  | { status: 'review'; reviewQueue: string; priority?: 'low' | 'medium' | 'high' }
  | { status: 'reject'; reason: string };

interface GateConfig {
  // Phase identifier
  phase: 'phase-0-1' | 'phase-1-2' | 'phase-2-3';

  // Gate type
  gateType: 'automatic' | 'manual' | 'hybrid';

  // Thresholds (0–100 scale)
  thresholds: {
    highThreshold: number;    // Auto-advance if score >= this
    lowThreshold: number;     // Auto-reject if score < this
  };

  // Scoring configuration
  scoringCriteria: ScoringCriterion[];

  // Override rules
  allowOverrides: boolean;
  overrideRequiresJustification: boolean;

  // Review queue assignment
  defaultReviewQueue?: string;

  // SLA tracking
  reviewSLAHours?: number;
  escalationEnabled?: boolean;
}

interface GateDecision {
  status: 'advance' | 'review' | 'reject';
  reason: string;
  score?: number;
  scoringBreakdown?: Record<string, number>;
  auditTrail: AuditEntry;
}
```

---

## 2. Gate Logic Design

### Threshold Configuration

Thresholds are stored in Supabase and editable via admin UI. Each gate has two thresholds:

- **HIGH_THRESHOLD** — Items scoring this or above auto-advance
- **LOW_THRESHOLD** — Items scoring below this auto-reject

For hybrid gates:

```
MIDDLE_BAND = [LOW_THRESHOLD, HIGH_THRESHOLD)
```

Thresholds are **calibrated iteratively** based on outcomes:
1. Start with conservative (wide middle band)
2. Track outcomes of reviewed items
3. Adjust thresholds based on what actually succeeds

### Scoring Criteria Per Gate

Each gate scores the item across multiple dimensions and combines them into a composite score.

#### Phase 0→1: Opportunity Score

```typescript
interface OpportunityScoring {
  // Market size estimate (0–100)
  marketSize: number;

  // Strength of converging signals (0–100)
  signalStrength: number;

  // How much can be automated (0–100)
  agentReadiness: number;

  // Competitive density — lower is better (0–100, inverted)
  competitiveDensity: number;

  // Confidence that window is open now (0–100)
  timingConfidence: number;

  // Weights (sum to 1.0)
  weights: {
    marketSize: 0.25;
    signalStrength: 0.20;
    agentReadiness: 0.25;
    competitiveDensity: 0.15;
    timingConfidence: 0.15;
  };
}

// Composite score = weighted sum of dimensions
compositeScore =
  (marketSize * 0.25) +
  (signalStrength * 0.20) +
  (agentReadiness * 0.25) +
  (100 - competitiveDensity) * 0.15 +
  (timingConfidence * 0.15)
```

#### Phase 1→2: Concept Score

```typescript
interface ConceptScoring {
  // How fundamentally it changes the market (0–100)
  disruptionPotential: number;

  // What % of operations can be agent-handled (0–100)
  agentReadiness: number;

  // Can this be built with current tech? (0–100)
  feasibility: number;

  // How distinct from competitors (0–100)
  differentiation: number;

  // Is there an obvious revenue model? (0–100)
  revenueClarity: number;

  // Weights
  weights: {
    disruptionPotential: 0.25;
    agentReadiness: 0.20;
    feasibility: 0.20;
    differentiation: 0.20;
    revenueClarity: 0.15;
  };
}

compositeScore =
  (disruptionPotential * 0.25) +
  (agentReadiness * 0.20) +
  (feasibility * 0.20) +
  (differentiation * 0.20) +
  (revenueClarity * 0.15)
```

#### Phase 2→3: Validation Verdict

```typescript
interface ValidationScoring {
  // Go/No-Go recommendation from validation-synthesizer
  verdict: 'go' | 'no-go';

  // Confidence in that verdict (0–100)
  confidence: number;

  // Supporting score from evidence
  evidenceScore: number;  // Weighted average of all evidence strengths
}

// Gate logic for validation:
// if verdict === 'go' && confidence >= 80 → Advance
// if verdict === 'go' && 50 <= confidence < 80 → Review
// if verdict === 'no-go' → Reject
```

### Multi-Criteria Gates: Combining Scores

When a gate combines multiple scored dimensions:

```typescript
async function combineScores(scores: Record<string, number>, weights: Record<string, number>): Promise<number> {
  let composite = 0;
  let totalWeight = 0;

  for (const [dimension, score] of Object.entries(scores)) {
    const weight = weights[dimension] || 0;
    composite += score * weight;
    totalWeight += weight;
  }

  // Normalize to 0–100 scale
  return totalWeight > 0 ? composite / totalWeight : 0;
}
```

### Override Rules

Humans can override automatic decisions. Overrides are tracked in the audit trail.

```typescript
interface OverrideRequest {
  itemId: string;
  gateName: string;

  // The overridden decision
  originalDecision: GateDecision;
  newDecision: 'advance' | 'reject';

  // Why?
  justification: string;

  // Who made the override?
  overriddenBy: string;  // user ID
  overriddenAt: Date;
}

// Override rules:
// - Allowed by gates where config.allowOverrides === true
// - If config.overrideRequiresJustification === true, justification is required
// - All overrides logged in audit trail
// - Overrides can be appealed (logged as new audit entry)
```

---

## 3. Human Review Workflow

### How Items Land in Review

When a gate returns `status: 'review'`, the item is:

1. Inserted into the `gate_review_queue` table in Supabase
2. A Realtime subscription notifies reviewers
3. The review UI loads the item with full context
4. Reviewer makes a decision (approve, reject, request-more-info, override-score, add-annotation)

```typescript
// Supabase table: gate_review_queue
type GateReviewQueueRow = {
  id: string;  // UUID
  item_id: string;  // The pipeline item being reviewed
  item_type: 'opportunity' | 'concept' | 'validation';
  gate_name: string;  // 'phase-0-1' | 'phase-1-2' | 'phase-2-3'

  // Item snapshot (denormalized for fast loading)
  item_snapshot: any;  // Full item JSON

  // Gate decision info
  gate_score: number;
  gate_decision: GateDecision;
  gate_metadata: Record<string, any>;

  // Review assignment
  assigned_to?: string;  // User ID of reviewer (optional)
  assigned_at?: Date;
  queue_name: string;  // 'default' | 'urgent' | 'technical' | etc.

  // Timestamps
  created_at: Date;
  updated_at: Date;
  review_deadline?: Date;  // SLA deadline

  // Status
  status: 'pending' | 'in-progress' | 'escalated' | 'completed';
};
```

### Review UI Design

The Next.js review interface shows:

```typescript
interface ReviewUI {
  // Item context
  itemId: string;
  itemType: 'opportunity' | 'concept' | 'validation';

  // Full item data
  item: OpportunityRow | ConceptRow | ValidationRow;

  // Gate decision info
  gateScore: number;
  scoringBreakdown: Record<string, number>;
  gateRecommendation: 'advance' | 'reject';

  // Recent activity (annotations, changes)
  recentChanges: Array<{ timestamp: Date; change: string }>;

  // Reviewer actions (buttons/forms)
  actions: {
    approve: () => Promise<void>;
    reject: (reason: string) => Promise<void>;
    requestMoreInfo: (question: string) => Promise<void>;
    overrideScore: (newScore: number, justification: string) => Promise<void>;
    addAnnotation: (annotation: string) => Promise<void>;
  };

  // Navigation
  navigation: {
    previousItem: () => void;
    nextItem: () => void;
    backToQueue: () => void;
  };
}
```

**Example Review UI Component:**

```typescript
// app/review/[itemId]/page.tsx

export default function ReviewPage({ params }: { params: { itemId: string } }) {
  const [item, setItem] = useState<any>(null);
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch item and review context
    supabase
      .from('gate_review_queue')
      .select('*')
      .eq('item_id', params.itemId)
      .single()
      .then(({ data }) => setItem(data));
  }, [params.itemId]);

  async function handleApprove() {
    setLoading(true);
    await supabase
      .from('gate_review_queue')
      .update({
        status: 'completed',
        updated_at: new Date(),
      })
      .eq('item_id', params.itemId);

    // Notify pipeline-orchestrator to advance item
    await fetch('/api/gates/advance', {
      method: 'POST',
      body: JSON.stringify({ itemId: params.itemId, decision: 'approve' }),
    });

    setLoading(false);
  }

  async function handleReject() {
    setLoading(true);
    await supabase
      .from('gate_review_queue')
      .update({
        status: 'completed',
        updated_at: new Date(),
      })
      .eq('item_id', params.itemId);

    await fetch('/api/gates/reject', {
      method: 'POST',
      body: JSON.stringify({
        itemId: params.itemId,
        reason: justification,
      }),
    });

    setLoading(false);
  }

  if (!item) return <div>Loading...</div>;

  return (
    <div className="review-container">
      <div className="item-context">
        <h1>{item.item_snapshot.name || 'Untitled'}</h1>
        <div className="gate-score">
          Score: {item.gate_score.toFixed(1)}/100
        </div>
        <div className="scoring-breakdown">
          {Object.entries(item.gate_metadata.scoringBreakdown || {}).map(
            ([dimension, score]) => (
              <div key={dimension}>
                {dimension}: {(score as number).toFixed(1)}
              </div>
            )
          )}
        </div>
      </div>

      <div className="item-details">
        <pre>{JSON.stringify(item.item_snapshot, null, 2)}</pre>
      </div>

      <div className="review-actions">
        <button onClick={handleApprove} disabled={loading}>
          Approve
        </button>
        <button onClick={handleReject} disabled={loading}>
          Reject
        </button>
        <textarea
          placeholder="Justification for decision..."
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
        />
      </div>
    </div>
  );
}
```

### Review Actions

```typescript
type ReviewAction =
  | { type: 'approve' }
  | { type: 'reject'; reason: string }
  | { type: 'request-more-info'; question: string }
  | { type: 'override-score'; newScore: number; justification: string }
  | { type: 'add-annotation'; annotation: string };

async function handleReviewAction(
  itemId: string,
  action: ReviewAction
): Promise<void> {
  // Log the action in audit trail
  await supabase.from('gate_audit_log').insert({
    item_id: itemId,
    action_type: action.type,
    action_details: action,
    actor_id: currentUserId,
    timestamp: new Date(),
  });

  // Update gate_review_queue
  if (action.type === 'approve') {
    await notifyPipelineOrchestrator({
      itemId,
      decision: 'advance',
    });
  } else if (action.type === 'reject') {
    await notifyPipelineOrchestrator({
      itemId,
      decision: 'reject',
      reason: action.reason,
    });
  } else if (action.type === 'override-score') {
    // Re-evaluate gate with new score
    const newDecision = evaluateGateWithScore(action.newScore);
    await notifyPipelineOrchestrator({
      itemId,
      decision: newDecision.status,
      overrideJustification: action.justification,
    });
  }
  // ... handle other action types
}
```

### Review Assignment

Reviewers can be assigned by:

1. **Default queue** — Random assignment from available reviewers
2. **Domain expertise** — Assign to reviewer tagged with relevant domain
3. **Manual assignment** — Admin assigns to specific reviewer
4. **Round-robin** — Distribute evenly across team

```typescript
interface ReviewAssignment {
  queueName: string;  // e.g., 'default', 'technical', 'market-research'
  assignmentStrategy: 'random' | 'round-robin' | 'domain-expert' | 'manual';
  reviewers: Array<{
    userId: string;
    domains?: string[];  // For domain-expert strategy
    activeAssignments: number;  // Current load
  }>;
}

async function assignReviewerToItem(
  itemId: string,
  assignment: ReviewAssignment
): Promise<string> {
  let reviewerId: string;

  if (assignment.assignmentStrategy === 'random') {
    reviewerId = assignment.reviewers[
      Math.floor(Math.random() * assignment.reviewers.length)
    ].userId;
  } else if (assignment.assignmentStrategy === 'round-robin') {
    // Assign to reviewer with fewest active assignments
    const sorted = assignment.reviewers.sort(
      (a, b) => a.activeAssignments - b.activeAssignments
    );
    reviewerId = sorted[0].userId;
  }

  // Update assignment
  await supabase
    .from('gate_review_queue')
    .update({ assigned_to: reviewerId, assigned_at: new Date() })
    .eq('item_id', itemId);

  return reviewerId;
}
```

### SLA Tracking

Each review item has an SLA deadline. Escalation triggers if item isn't reviewed in time.

```typescript
interface SLAConfig {
  reviewSLAHours: number;  // e.g., 24, 48, 72
  escalationEnabled: boolean;
  escalationTargets: string[];  // User IDs or team names
}

// Supabase table: gate_review_sla
type SLARow = {
  item_id: string;
  queue_name: string;
  created_at: Date;
  sla_deadline: Date;  // created_at + SLAHours
  escalation_triggered_at?: Date;
  escalation_level: number;  // 1 = assigned reviewer, 2 = queue manager, 3 = director
};

// Cron job: Every hour, check for overdue items and escalate
async function escalateOverdueItems() {
  const overdue = await supabase
    .from('gate_review_queue')
    .select('*')
    .eq('status', 'pending')
    .lt('review_deadline', new Date());

  for (const item of overdue) {
    // Move to next escalation level
    const config = await getGateConfig(item.gate_name);
    if (config.escalationEnabled) {
      await supabase
        .from('gate_review_sla')
        .update({
          escalation_level: item.escalation_level + 1,
          escalation_triggered_at: new Date(),
        })
        .eq('item_id', item.item_id);

      // Notify escalation targets
      await notifyEscalation(item, config.escalationTargets);
    }
  }
}
```

---

## 4. Gate State Management

### Pipeline Item State Transitions

Each pipeline item has a `state` field that tracks its position in the pipeline.

```typescript
type PipelineItemState =
  | 'pending-review'      // Entered review queue, awaiting decision
  | 'approved'            // Passed a gate, moving forward
  | 'rejected'            // Failed a gate, archived
  | 'overridden'          // Human override applied
  | 'archived'            // No longer active
  | 'escalated'           // SLA escalation triggered

// Each pipeline item table has these fields:
type PipelineItemRow = {
  id: string;
  // ... domain-specific fields ...

  state: PipelineItemState;
  state_updated_at: Date;
  current_phase: 'phase-0' | 'phase-1' | 'phase-2' | 'phase-3';

  // Gate info
  last_gate_passed?: string;  // 'phase-0-1' | 'phase-1-2' | etc.
  last_gate_passed_at?: Date;
  next_gate: string;  // Next gate to encounter
};
```

### Pipeline Orchestrator Notification

When a gate makes a decision, it notifies the pipeline-orchestrator via Supabase or HTTP.

```typescript
// Option 1: Supabase function call
async function notifyPipelineOfGateDecision(
  itemId: string,
  decision: GateDecision
): Promise<void> {
  const rpc = await supabase.rpc('gate_decision_made', {
    item_id: itemId,
    decision_status: decision.status,
    decision_reason: decision.reason,
  });

  if (rpc.error) throw rpc.error;
}

// Option 2: HTTP API call
async function notifyPipelineOfGateDecision(
  itemId: string,
  decision: GateDecision
): Promise<void> {
  const response = await fetch(
    `${process.env.PIPELINE_ORCHESTRATOR_URL}/gate-decision`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ORCHESTRATOR_API_KEY}`,
      },
      body: JSON.stringify({
        itemId,
        decision,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Orchestrator rejected gate decision: ${response.statusText}`);
  }
}
```

### Audit Trail

Every gate decision is logged with full context.

```typescript
// Supabase table: gate_audit_log
type AuditLogRow = {
  id: string;  // UUID
  item_id: string;
  gate_name: string;

  // Decision
  decision: 'advance' | 'review' | 'reject';
  decision_reason: string;

  // Scoring
  score: number;
  scoring_breakdown: Record<string, number>;

  // Who decided?
  decided_by: 'system' | string;  // 'system' for automatic, user ID for human
  decision_method: 'automatic' | 'manual' | 'override';

  // Timestamps
  decided_at: Date;
  logged_at: Date;

  // Full context (for auditability)
  item_snapshot: any;
  gate_config_snapshot: any;
  metadata: Record<string, any>;
};

async function logGateDecision(
  itemId: string,
  gateName: string,
  decision: GateDecision,
  decidedBy: string
): Promise<void> {
  await supabase.from('gate_audit_log').insert({
    item_id: itemId,
    gate_name: gateName,
    decision: decision.status,
    decision_reason: decision.reason,
    score: decision.score || 0,
    scoring_breakdown: decision.scoringBreakdown || {},
    decided_by: decidedBy,
    decision_method: decidedBy === 'system' ? 'automatic' : 'manual',
    decided_at: new Date(),
    logged_at: new Date(),
    item_snapshot: decision.itemSnapshot,
    gate_config_snapshot: decision.gateConfigSnapshot,
  });
}
```

---

## 5. Notification on Gate Events

### When to Notify

```typescript
enum GateEventType {
  // Review-related
  ItemEntersReview = 'item_enters_review',
  ReviewDecisionMade = 'review_decision_made',
  ReviewSLAEscalated = 'review_sla_escalated',

  // Gate-related
  ItemAdvanced = 'item_advanced',
  ItemRejected = 'item_rejected',
  GateConfigUpdated = 'gate_config_updated',

  // Override-related
  DecisionOverridden = 'decision_overridden',
}

interface GateEventNotification {
  eventType: GateEventType;
  itemId: string;
  itemType: string;
  gateName: string;
  timestamp: Date;

  // Event-specific data
  data: Record<string, any>;

  // Recipients
  recipients: Array<{
    userId: string;
    channel: 'email' | 'in-app' | 'slack' | 'webhook';
  }>;
}
```

### Notify Reviewers

When an item enters the review queue:

```typescript
async function notifyReviewersOfNewItem(
  itemId: string,
  queueName: string
): Promise<void> {
  // Get list of reviewers for this queue
  const queue = await supabase
    .from('review_queues')
    .select('reviewers')
    .eq('name', queueName)
    .single();

  // Create notification
  const notification: GateEventNotification = {
    eventType: GateEventType.ItemEntersReview,
    itemId,
    itemType: 'concept',  // or 'opportunity', 'validation'
    gateName: queueName,
    timestamp: new Date(),
    data: {
      queueName,
      priority: 'medium',
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
    recipients: queue.data.reviewers.map((reviewer) => ({
      userId: reviewer.id,
      channel: reviewer.preferredChannel || 'in-app',
    })),
  };

  // Send notifications
  for (const recipient of notification.recipients) {
    if (recipient.channel === 'email') {
      await sendEmailNotification(recipient.userId, notification);
    } else if (recipient.channel === 'slack') {
      await sendSlackNotification(recipient.userId, notification);
    } else {
      await createInAppNotification(recipient.userId, notification);
    }
  }
}
```

### Notify Pipeline on Advancement

When an item passes a gate and advances:

```typescript
async function notifyPipelineOfAdvancement(
  itemId: string,
  nextPhase: string
): Promise<void> {
  // Event for audit/logging
  const notification: GateEventNotification = {
    eventType: GateEventType.ItemAdvanced,
    itemId,
    itemType: 'concept',
    gateName: nextPhase,
    timestamp: new Date(),
    data: { nextPhase },
    recipients: [
      {
        userId: 'pipeline-orchestrator',
        channel: 'webhook',
      },
    ],
  };

  // Trigger orchestrator to move item forward
  await fetch(`${process.env.ORCHESTRATOR_WEBHOOK}`, {
    method: 'POST',
    body: JSON.stringify(notification),
  });
}
```

### Notify Stakeholders on Rejection

When an item fails a gate:

```typescript
async function notifyStakeholdersOfRejection(
  itemId: string,
  rejectionReason: string,
  creator?: string
): Promise<void> {
  const notification: GateEventNotification = {
    eventType: GateEventType.ItemRejected,
    itemId,
    itemType: 'concept',
    gateName: 'phase-1-2',  // example
    timestamp: new Date(),
    data: {
      rejectionReason,
      nextReviewDate: null,  // Could offer appeal process
    },
    recipients: creator
      ? [{ userId: creator, channel: 'email' }]
      : [],
  };

  // Notify creator and relevant stakeholders
  for (const recipient of notification.recipients) {
    await sendEmailNotification(recipient.userId, {
      subject: 'Concept Rejected',
      body: `Your concept was not advanced at the Phase 1→2 gate. Reason: ${rejectionReason}`,
    });
  }
}
```

---

## 6. Configuration UI

### Admin Gate Configuration Page

A Next.js admin page for managing gate thresholds and behavior.

```typescript
// app/admin/gates/page.tsx

export default function GateConfigPage() {
  const [gates, setGates] = useState<GateConfig[]>([]);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<GateConfig>>({});

  useEffect(() => {
    // Load all gate configs
    supabase
      .from('gate_config')
      .select('*')
      .then(({ data }) => setGates(data || []));
  }, []);

  async function handleSave() {
    if (!selectedGate) return;

    await supabase
      .from('gate_config')
      .update(formData)
      .eq('phase', selectedGate);

    setGates(
      gates.map((g) => (g.phase === selectedGate ? { ...g, ...formData } : g))
    );
  }

  return (
    <div className="gate-config-admin">
      <h1>Gate Configuration</h1>

      <div className="gates-list">
        {gates.map((gate) => (
          <button
            key={gate.phase}
            onClick={() => {
              setSelectedGate(gate.phase);
              setFormData(gate);
            }}
          >
            {gate.phase}
          </button>
        ))}
      </div>

      {selectedGate && (
        <div className="gate-editor">
          <h2>Configure {selectedGate}</h2>

          <label>
            Gate Type:
            <select
              value={formData.gateType || 'hybrid'}
              onChange={(e) =>
                setFormData({ ...formData, gateType: e.target.value as any })
              }
            >
              <option>automatic</option>
              <option>manual</option>
              <option>hybrid</option>
            </select>
          </label>

          <label>
            High Threshold (auto-advance if score >=):
            <input
              type="number"
              min="0"
              max="100"
              value={formData.thresholds?.highThreshold || 75}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  thresholds: {
                    ...formData.thresholds,
                    highThreshold: parseInt(e.target.value),
                  },
                })
              }
            />
          </label>

          <label>
            Low Threshold (auto-reject if score <):
            <input
              type="number"
              min="0"
              max="100"
              value={formData.thresholds?.lowThreshold || 40}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  thresholds: {
                    ...formData.thresholds,
                    lowThreshold: parseInt(e.target.value),
                  },
                })
              }
            />
          </label>

          <label>
            Allow Overrides:
            <input
              type="checkbox"
              checked={formData.allowOverrides || false}
              onChange={(e) =>
                setFormData({ ...formData, allowOverrides: e.target.checked })
              }
            />
          </label>

          <label>
            Review SLA (hours):
            <input
              type="number"
              min="1"
              value={formData.reviewSLAHours || 48}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  reviewSLAHours: parseInt(e.target.value),
                })
              }
            />
          </label>

          <button onClick={handleSave}>Save Configuration</button>
        </div>
      )}
    </div>
  );
}
```

### Per-Phase Threshold Settings

Store thresholds per gate in Supabase:

```typescript
// Schema: gate_config table
interface GateConfigRow {
  id: string;
  phase: 'phase-0-1' | 'phase-1-2' | 'phase-2-3';

  // Thresholds
  high_threshold: number;
  low_threshold: number;

  // Gate behavior
  gate_type: 'automatic' | 'manual' | 'hybrid';
  allow_overrides: boolean;
  override_requires_justification: boolean;

  // Review
  default_review_queue: string;
  review_sla_hours: number;
  escalation_enabled: boolean;

  // Metadata
  created_at: Date;
  updated_at: Date;
  updated_by: string;  // User ID
}
```

### Gate Bypass for Testing

Allow bypass of gates in development/testing:

```typescript
// Gate evaluation with bypass check
async function evaluateGate(
  item: any,
  gate: Gate<any>
): Promise<GateDecision> {
  // Check for bypass
  const bypassEnabled =
    process.env.GATE_BYPASS_ENABLED === 'true' ||
    (process.env.NODE_ENV === 'development' && process.env.GATE_BYPASS_DEV === 'true');

  if (bypassEnabled) {
    return {
      status: 'advance',
      reason: 'Gate bypassed (test/dev mode)',
      auditTrail: {
        decidedBy: 'system-bypass',
        decidedAt: new Date(),
      },
    };
  }

  // Normal evaluation
  return gate.evaluate(item);
}
```

---

## 7. Code Structure

### Shared Gate Evaluation Library

```typescript
// lib/gates/gate-evaluator.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function evaluateItem<T>(
  item: T,
  gateName: string,
  scoringFn: (item: T) => Promise<number>
): Promise<GateDecision> {
  // Get gate configuration
  const config = await getGateConfig(gateName);

  // Score the item
  const score = await scoringFn(item);

  // Apply threshold logic
  let decision: GateDecision;

  if (score >= config.high_threshold) {
    decision = {
      status: 'advance',
      reason: `Score ${score} meets high threshold ${config.high_threshold}`,
      score,
    };
  } else if (score < config.low_threshold) {
    decision = {
      status: 'reject',
      reason: `Score ${score} below low threshold ${config.low_threshold}`,
      score,
    };
  } else {
    decision = {
      status: 'review',
      reason: `Score ${score} in middle band [${config.low_threshold}, ${config.high_threshold})`,
      score,
      reviewQueue: config.default_review_queue,
    };
  }

  // Log decision
  await logGateDecision(gateName, item, decision, 'system');

  // If review, enqueue
  if (decision.status === 'review') {
    await enqueueForReview(gateName, item, decision);
  }

  return decision;
}

async function getGateConfig(gateName: string): Promise<GateConfig> {
  const { data } = await supabase
    .from('gate_config')
    .select('*')
    .eq('phase', gateName)
    .single();

  return data as GateConfig;
}

async function logGateDecision(
  gateName: string,
  item: any,
  decision: GateDecision,
  decidedBy: string
): Promise<void> {
  await supabase.from('gate_audit_log').insert({
    gate_name: gateName,
    item_id: item.id,
    decision: decision.status,
    decision_reason: decision.reason,
    score: decision.score,
    decided_by: decidedBy,
    decided_at: new Date(),
    item_snapshot: item,
  });
}

async function enqueueForReview(
  gateName: string,
  item: any,
  decision: GateDecision
): Promise<void> {
  const config = await getGateConfig(gateName);

  await supabase.from('gate_review_queue').insert({
    item_id: item.id,
    item_type: getItemType(item),
    gate_name: gateName,
    item_snapshot: item,
    gate_score: decision.score,
    gate_decision: decision,
    queue_name: config.default_review_queue || 'default',
    status: 'pending',
    created_at: new Date(),
  });
}

function getItemType(item: any): 'opportunity' | 'concept' | 'validation' {
  if (item.market && item.signals) return 'opportunity';
  if (item.concept_name && item.landscape_report) return 'concept';
  if (item.verdict) return 'validation';
  return 'opportunity';  // default
}
```

### Per-Gate Configuration

Each gate has its own configuration file:

```typescript
// lib/gates/phase-1-2-concept-selector.ts

import { evaluateItem } from './gate-evaluator';
import { ConceptRow } from '@/types/pipeline';

interface ConceptScoring {
  disruptionPotential: number;
  agentReadiness: number;
  feasibility: number;
  differentiation: number;
  revenueClarity: number;
}

export async function evaluateConceptForPhase2(
  concept: ConceptRow
): Promise<GateDecision> {
  return evaluateItem(concept, 'phase-1-2', async (item) => {
    // Extract or compute scoring dimensions
    const scoring: ConceptScoring = {
      disruptionPotential: item.disruption_score || 0,
      agentReadiness: item.agent_readiness_score || 0,
      feasibility: item.feasibility_score || 0,
      differentiation: item.differentiation_score || 0,
      revenueClarity: item.revenue_clarity_score || 0,
    };

    // Compute composite score
    const weights = {
      disruptionPotential: 0.25,
      agentReadiness: 0.20,
      feasibility: 0.20,
      differentiation: 0.20,
      revenueClarity: 0.15,
    };

    const composite =
      (scoring.disruptionPotential * weights.disruptionPotential +
        scoring.agentReadiness * weights.agentReadiness +
        scoring.feasibility * weights.feasibility +
        scoring.differentiation * weights.differentiation +
        scoring.revenueClarity * weights.revenueClarity) /
      Object.values(weights).reduce((a, b) => a + b, 0);

    return composite;
  });
}
```

### Integration with Pipeline Orchestrator

When a gate makes a decision, notify the orchestrator:

```typescript
// lib/gates/gate-orchestrator-integration.ts

export async function notifyPipelineOfDecision(
  itemId: string,
  decision: GateDecision,
  gateName: string
): Promise<void> {
  const orchestratorUrl = process.env.PIPELINE_ORCHESTRATOR_URL;

  if (!orchestratorUrl) {
    console.warn('PIPELINE_ORCHESTRATOR_URL not set');
    return;
  }

  const response = await fetch(`${orchestratorUrl}/gate-decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ORCHESTRATOR_API_KEY || ''}`,
    },
    body: JSON.stringify({
      itemId,
      gateName,
      decision,
      timestamp: new Date(),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Orchestrator error: ${response.status} ${response.statusText}`
    );
  }
}
```

---

## 8. Reference Implementation

Complete TypeScript implementation of the Phase 1→2 gate (concept-selector).

### API Endpoint: /api/gates/evaluate-concept

```typescript
// app/api/gates/evaluate-concept/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { evaluateConceptForPhase2 } from '@/lib/gates/phase-1-2-concept-selector';
import { notifyPipelineOfDecision } from '@/lib/gates/gate-orchestrator-integration';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { conceptId } = await request.json();

    // Fetch concept
    const { data: concept, error } = await supabase
      .from('concepts')
      .select('*')
      .eq('id', conceptId)
      .single();

    if (error || !concept) {
      return NextResponse.json(
        { error: 'Concept not found' },
        { status: 404 }
      );
    }

    // Evaluate concept at gate
    const decision = await evaluateConceptForPhase2(concept);

    // Notify orchestrator
    await notifyPipelineOfDecision(conceptId, decision, 'phase-1-2');

    return NextResponse.json({ decision });
  } catch (err) {
    console.error('Gate evaluation error:', err);
    return NextResponse.json(
      { error: 'Gate evaluation failed' },
      { status: 500 }
    );
  }
}
```

### Review Decision Handler: /api/gates/review-decision

```typescript
// app/api/gates/review-decision/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

interface ReviewDecisionPayload {
  itemId: string;
  decision: 'approve' | 'reject';
  reason?: string;
  overrideScore?: number;
  overrideJustification?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: ReviewDecisionPayload = await request.json();
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get review queue item
    const { data: reviewItem } = await supabase
      .from('gate_review_queue')
      .select('*')
      .eq('item_id', payload.itemId)
      .single();

    if (!reviewItem) {
      return NextResponse.json(
        { error: 'Review item not found' },
        { status: 404 }
      );
    }

    // Handle override if present
    let finalDecision = payload.decision;

    if (payload.overrideScore !== undefined) {
      // Log override
      await supabase.from('gate_audit_log').insert({
        item_id: payload.itemId,
        gate_name: reviewItem.gate_name,
        decision: payload.decision,
        decision_reason: payload.overrideJustification || 'Override by reviewer',
        score: payload.overrideScore,
        decided_by: userId,
        decision_method: 'override',
        decided_at: new Date(),
        item_snapshot: reviewItem.item_snapshot,
      });

      finalDecision = payload.decision;
    }

    // Update review queue
    await supabase
      .from('gate_review_queue')
      .update({
        status: 'completed',
        updated_at: new Date(),
      })
      .eq('item_id', payload.itemId);

    // Log decision in audit trail
    await supabase.from('gate_audit_log').insert({
      item_id: payload.itemId,
      gate_name: reviewItem.gate_name,
      decision: finalDecision,
      decision_reason: payload.reason || 'No reason provided',
      decided_by: userId,
      decision_method: 'manual',
      decided_at: new Date(),
      item_snapshot: reviewItem.item_snapshot,
    });

    // Notify pipeline orchestrator
    await fetch(`${process.env.PIPELINE_ORCHESTRATOR_URL}/gate-decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ORCHESTRATOR_API_KEY || ''}`,
      },
      body: JSON.stringify({
        itemId: payload.itemId,
        gateName: reviewItem.gate_name,
        decision: {
          status: finalDecision === 'approve' ? 'advance' : 'reject',
          reason: payload.reason || 'No reason provided',
        },
      }),
    });

    return NextResponse.json({ success: true, decision: finalDecision });
  } catch (err) {
    console.error('Review decision error:', err);
    return NextResponse.json(
      { error: 'Review decision failed' },
      { status: 500 }
    );
  }
}
```

### State Transition Handler

```typescript
// lib/gates/state-transition.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function transitionItemState(
  itemId: string,
  itemType: 'opportunity' | 'concept' | 'validation',
  newState: PipelineItemState,
  metadata?: Record<string, any>
): Promise<void> {
  const tableName = getTableName(itemType);

  // Update item state
  await supabase
    .from(tableName)
    .update({
      state: newState,
      state_updated_at: new Date(),
      ...metadata,
    })
    .eq('id', itemId);

  // Log state transition
  await supabase.from('pipeline_state_log').insert({
    item_id: itemId,
    item_type: itemType,
    from_state: metadata?.fromState || 'unknown',
    to_state: newState,
    transitioned_at: new Date(),
    metadata,
  });
}

function getTableName(
  itemType: 'opportunity' | 'concept' | 'validation'
): string {
  switch (itemType) {
    case 'opportunity':
      return 'opportunities';
    case 'concept':
      return 'concepts';
    case 'validation':
      return 'validations';
  }
}

type PipelineItemState =
  | 'pending-review'
  | 'approved'
  | 'rejected'
  | 'overridden'
  | 'archived'
  | 'escalated';
```

### Realtime Subscription for Review Queue

```typescript
// hooks/useReviewQueue.ts

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export function useReviewQueue(queueName: string) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    supabase
      .from('gate_review_queue')
      .select('*')
      .eq('queue_name', queueName)
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });

    // Subscribe to changes
    const subscription = supabase
      .channel(`review-queue:${queueName}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gate_review_queue',
          filter: `queue_name=eq.${queueName}`,
        },
        (payload) => {
          setItems((prev) => [payload.new as any, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'gate_review_queue',
          filter: `queue_name=eq.${queueName}`,
        },
        (payload) => {
          if (payload.new.status === 'completed') {
            // Remove from queue
            setItems((prev) =>
              prev.filter((item) => item.id !== payload.new.id)
            );
          } else {
            // Update item
            setItems((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? (payload.new as any) : item
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queueName]);

  return { items, loading };
}
```

### Complete Concept Scoring Function

```typescript
// lib/gates/concept-scoring.ts

import { ConceptRow } from '@/types/pipeline';

interface ConceptScoringResult {
  dimensions: {
    disruptionPotential: number;
    agentReadiness: number;
    feasibility: number;
    differentiation: number;
    revenueClarity: number;
  };
  weights: Record<string, number>;
  composite: number;
  breakdown: Record<string, number>;
}

export async function scoreConcept(
  concept: ConceptRow
): Promise<ConceptScoringResult> {
  // Extract scores from concept (these are computed by concept-scorer agent)
  const dimensions = {
    disruptionPotential: concept.disruption_score || 0,
    agentReadiness: concept.agent_readiness_score || 0,
    feasibility: concept.feasibility_score || 0,
    differentiation: concept.differentiation_score || 0,
    revenueClarity: concept.revenue_clarity_score || 0,
  };

  // Standard weights
  const weights = {
    disruptionPotential: 0.25,
    agentReadiness: 0.20,
    feasibility: 0.20,
    differentiation: 0.20,
    revenueClarity: 0.15,
  };

  // Compute composite
  let composite = 0;
  let totalWeight = 0;

  for (const [dimension, score] of Object.entries(dimensions)) {
    const weight = weights[dimension] || 0;
    composite += score * weight;
    totalWeight += weight;
  }

  composite = totalWeight > 0 ? composite / totalWeight : 0;

  // Clamp to 0–100
  composite = Math.max(0, Math.min(100, composite));

  return {
    dimensions,
    weights,
    composite,
    breakdown: {
      ...dimensions,
      composite,
    },
  };
}
```

### Audit Trail Query Helper

```typescript
// lib/gates/audit-queries.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function getAuditTrailForItem(itemId: string) {
  const { data } = await supabase
    .from('gate_audit_log')
    .select('*')
    .eq('item_id', itemId)
    .order('decided_at', { ascending: false });

  return data || [];
}

export async function getGateDecisionsForPhase(
  phase: 'phase-0-1' | 'phase-1-2' | 'phase-2-3'
) {
  const { data } = await supabase
    .from('gate_audit_log')
    .select('*')
    .eq('gate_name', phase)
    .order('decided_at', { ascending: false });

  return data || [];
}

export async function getDecisionStats(
  phase: 'phase-0-1' | 'phase-1-2' | 'phase-2-3',
  startDate: Date,
  endDate: Date
) {
  const { data } = await supabase
    .from('gate_audit_log')
    .select('decision, count')
    .eq('gate_name', phase)
    .gte('decided_at', startDate)
    .lte('decided_at', endDate);

  const stats = {
    advance: 0,
    review: 0,
    reject: 0,
  };

  for (const row of data || []) {
    stats[row.decision as keyof typeof stats] += row.count || 1;
  }

  return stats;
}
```

---

## Summary Table

| Aspect | Implementation |
|--------|----------------|
| **Gate Types** | Automatic, Manual, Hybrid (3-band threshold) |
| **Scoring** | Multi-dimensional with weights; normalized to 0–100 |
| **State** | Pipeline item state field; state_updated_at timestamp |
| **Review Queue** | Supabase table; Realtime subscriptions for live updates |
| **Audit Logging** | Complete decision trail with snapshot, scorer, timestamp |
| **Notification** | Email, Slack, in-app; event-driven via Supabase or webhooks |
| **Configuration** | Supabase table; admin UI for threshold adjustment |
| **SLA Tracking** | Deadline calculation; hourly escalation cron |
| **Orchestrator** | HTTP POST to /gate-decision endpoint |
| **Tech Stack** | Next.js, Supabase, TypeScript, Vercel (functions for crons) |

---

## Deployment Checklist

- [ ] Create Supabase tables: `gate_config`, `gate_review_queue`, `gate_audit_log`, `gate_review_sla`
- [ ] Set up Realtime subscriptions on gate_review_queue
- [ ] Deploy gate evaluation API endpoints
- [ ] Deploy review UI pages
- [ ] Configure admin gate config page
- [ ] Set up escalation cron job (Vercel Cron or external scheduler)
- [ ] Configure environment variables: `ORCHESTRATOR_URL`, `ORCHESTRATOR_API_KEY`
- [ ] Test threshold adjustments and overrides
- [ ] Set up notifications (email, Slack, in-app)
- [ ] Document gate threshold values for each phase in runbook
