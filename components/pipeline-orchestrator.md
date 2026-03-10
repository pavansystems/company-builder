# Pipeline Orchestrator — Component Specification

## 1. Purpose & Responsibility

The Pipeline Orchestrator is the central nervous system of Company Builder. It manages the execution of the entire idea-to-blueprint pipeline, orchestrating the flow of opportunities and concepts through Discovery (Phase 0), Ideation (Phase 1), Validation (Phase 2), and Blueprint (Phase 3) phases.

Its core responsibilities are:

- **State Management:** Track every opportunity and concept as it moves through the pipeline, maintaining a persistent record of its current phase, completion status, and decision history.
- **Agent Orchestration:** Trigger the appropriate agent at each step (source-scanner, signal-detector, concept-generator, etc.), pass inputs correctly, and collect outputs.
- **Gate Enforcement:** Execute automatic go/no-go decisions at phase boundaries based on scoring thresholds and rules; coordinate manual human reviews when required.
- **Workflow Coordination:** Handle the complex dependencies between pipeline steps (e.g., only run Phase 2 validation after a concept is selected in Phase 1; only generate a blueprint after validation passes).
- **Visibility & Auditability:** Provide real-time status visibility to the dashboard and ensure every decision is logged with rationale and timestamp.
- **Error Recovery:** Handle agent failures, timeouts, and retries gracefully; queue failed items for reprocessing.
- **Scaling & Throughput:** Manage concurrent pipeline items, batch operations, and prioritization.

The orchestrator is not a UI; it does not generate content. It is the engine that coordinates other components.

---

## 2. Inputs

The Pipeline Orchestrator receives inputs in the following contexts:

### 2.1 Pipeline Items

**Source:** Dashboard UI (user-initiated), Phase 0 continuous monitoring, or external API.

**Format & Schema:**

```json
{
  "itemId": "uuid",
  "type": "opportunity" | "concept",
  "sourcePhase": 0,
  "currentPhase": 1,
  "status": "queued" | "in_progress" | "completed" | "blocked" | "failed",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "data": {
    // Phase-specific content (see below)
  },
  "metadata": {
    "userId": "string",
    "priority": "high" | "normal" | "low",
    "tags": ["tag1", "tag2"],
    "externalId": "string (optional)"
  }
}
```

**Opportunity item (Phase 0 → Phase 1):**

```json
{
  "data": {
    "market": "string",
    "problem": "string",
    "enablingSignals": ["signal1", "signal2"],
    "agentReadiness": 0.75,
    "estimatedMarketSize": "TAM estimate",
    "competitiveDensity": "low" | "medium" | "high",
    "opportunityScore": 0.82
  }
}
```

**Concept item (Phase 1 → Phase 3):**

```json
{
  "data": {
    "opportunityId": "uuid",
    "name": "string",
    "description": "string",
    "painPointsAddressed": ["pain1", "pain2"],
    "agentMechanics": "string",
    "customerExperience": "string",
    "defensibility": "string",
    "conceptScore": 0.78,
    "scoreDimensions": {
      "disruptionPotential": 0.8,
      "agentReadiness": 0.75,
      "feasibility": 0.7,
      "differentiation": 0.8,
      "revenueClarity": 0.75
    }
  }
}
```

### 2.2 Gate Decisions

**Source:** Review Dashboard (manual override), automatic scoring thresholds.

**Format:**

```json
{
  "itemId": "uuid",
  "phase": 0 | 1 | 2,
  "decision": "approved" | "rejected" | "hold",
  "decidedBy": "auto" | "userId",
  "reasoning": "string (optional)",
  "timestamp": "ISO-8601"
}
```

### 2.3 Agent Task Completions

**Source:** Agents (via callback/webhook or polling).

**Format:**

```json
{
  "taskId": "uuid",
  "itemId": "uuid",
  "agentName": "concept-scorer" | "market-sizer" | etc,
  "phase": 1,
  "step": "1.4",
  "status": "success" | "failure",
  "output": {
    // Agent-specific output structure
  },
  "errorMessage": "string (if failure)",
  "executionTimeMs": 12000,
  "timestamp": "ISO-8601"
}
```

---

## 3. Outputs

The Pipeline Orchestrator produces the following outputs:

### 3.1 Pipeline Status Events

**Destination:** Data Store, Review Dashboard, Feedback Loop service.

**Format:**

```json
{
  "eventId": "uuid",
  "eventType": "item_created" | "step_started" | "step_completed" |
              "step_failed" | "gate_decision" | "phase_transition",
  "itemId": "uuid",
  "phase": 0 | 1 | 2 | 3,
  "step": "0.1" | "1.3" | etc,
  "timestamp": "ISO-8601",
  "details": {
    // Event-specific details
  }
}
```

### 3.2 Task Instructions to Agents

**Destination:** Individual agent services (via message queue or direct HTTP).

**Format:**

```json
{
  "taskId": "uuid",
  "agentName": "string",
  "phase": 0 | 1 | 2 | 3,
  "step": "0.1" | "1.4" | etc,
  "itemId": "uuid",
  "inputs": {
    // Agent-specific inputs
  },
  "config": {
    "timeout": 300000,
    "retryCount": 3,
    "callbackUrl": "https://..."
  },
  "priority": "high" | "normal" | "low"
}
```

### 3.3 Dashboard Snapshots

**Destination:** Review Dashboard (via REST or WebSocket).

**Format:**

```json
{
  "timestamp": "ISO-8601",
  "pipelineView": {
    "phase0": {
      "queued": 15,
      "inProgress": 3,
      "completed": 127,
      "rejected": 42
    },
    "phase1": { /* similar */ },
    "phase2": { /* similar */ },
    "phase3": { /* similar */ }
  },
  "recentItems": [
    {
      "itemId": "uuid",
      "type": "opportunity" | "concept",
      "phase": 1,
      "status": "in_progress",
      "name": "string",
      "lastUpdate": "ISO-8601"
    }
  ],
  "blockedItems": [
    {
      "itemId": "uuid",
      "reason": "agent failure" | "timeout" | "manual hold",
      "blockedSince": "ISO-8601"
    }
  ]
}
```

### 3.4 Audit Trail Entries

**Destination:** Data Store (audit log table).

**Format:**

```json
{
  "auditId": "uuid",
  "timestamp": "ISO-8601",
  "itemId": "uuid",
  "action": "created" | "transitioned" | "rejected" | "overridden",
  "fromPhase": 0 | 1 | 2 | 3 | null,
  "toPhase": 0 | 1 | 2 | 3 | null,
  "actor": "orchestrator" | "userId",
  "actorId": "string",
  "metadata": {
    "triggeredBy": "threshold" | "manual" | "error",
    "details": {}
  }
}
```

---

## 4. Core Logic / Algorithm

The orchestrator operates as a **state machine** managing items through the pipeline. Here is the step-by-step logic:

### 4.1 Item Lifecycle

```
Creation → Phase 0 → Gate 0 → Phase 1 → Gate 1 → Phase 2 → Gate 2 → Phase 3 → Completion
```

Each item has a **state** and a **current phase**. At each phase, a sequence of **steps** are executed sequentially or in parallel (if specified).

### 4.2 Phase Execution Model

For each phase and item:

1. **Queue the item:** Add it to a priority queue for that phase.
2. **Check prerequisites:** Verify all inputs are available (previous phase must be complete).
3. **Execute steps sequentially:**
   - For each step, dispatch a task to the appropriate agent.
   - Poll or await the agent's callback for completion.
   - If the agent returns success, store the output and mark step as complete.
   - If the agent times out (> 5 minutes), retry up to 3 times; if all retries fail, mark item as "blocked" and alert the Feedback Loop.
4. **Accumulate results:** Gather all step outputs into a phase-complete record.
5. **Trigger gate decision:** Move to phase gate logic.

### 4.3 Gate Decision Logic

At each phase boundary (end of Phase 0, 1, 2):

```pseudocode
function executeGate(item, phase):
  // Check for manual override from Review Dashboard
  if manualDecision = queryDashboardOverride(item.id):
    recordDecision(item, manualDecision, actor="human")
    return manualDecision

  // Check automatic rules
  scoreThreshold = getThresholdForPhase(phase)
  currentScore = item.data.compositeScore

  if currentScore >= scoreThreshold:
    decision = "approved"
  else:
    decision = "rejected"

  // Advance or archive
  if decision == "approved":
    item.phase = nextPhase
    item.status = "queued"
    enqueueItem(item)
  else:
    item.status = "rejected"
    archiveItem(item)

  recordDecision(item, decision, actor="orchestrator", reason="threshold-based")
```

### 4.4 Retry & Error Recovery

When an agent task fails:

```pseudocode
function handleAgentFailure(task, error):
  task.retryCount += 1

  if task.retryCount < maxRetries:
    delay = exponentialBackoff(task.retryCount)
    scheduleRetry(task, afterMs=delay)
  else:
    // Max retries exceeded
    item = getItem(task.itemId)
    item.status = "blocked"

    // Log the failure
    logFailure(item, task, error)

    // Alert Feedback Loop for analysis
    notifyFeedbackLoop({
      itemId: item.id,
      phase: item.phase,
      failedStep: task.step,
      failedAgent: task.agentName,
      error: error.message,
      timestamp: now()
    })
```

### 4.5 Concurrent Processing

The orchestrator uses a **work queue** pattern to handle multiple items:

- Maintain separate queues for each phase (Phase 0 queue, Phase 1 queue, etc.).
- Use a thread pool or async task executor to process items concurrently.
- Enforce **per-phase concurrency limits** to prevent overload (e.g., max 10 concurrent Phase 2 validations).
- Implement **priority queuing**: high-priority items jump ahead in the queue.
- Track **in-flight items** and enforce per-item concurrency (an item can only have one task in progress at a time).

### 4.6 Data Dependencies Between Phases

Some phases require outputs from previous phases as inputs:

```
Phase 1 (Ideation) requires:
  - Selected opportunity from Phase 0
  - Landscape report from step 1.1

Phase 2 (Validation) requires:
  - Selected concept from Phase 1
  - Concept scores from step 1.4

Phase 3 (Blueprint) requires:
  - Validated concept from Phase 2
  - Validation summary from step 2.6
  - All intermediate reports (landscape, market size, competitive analysis, etc.)
```

The orchestrator must:
- Check that all required inputs are available before queuing a phase.
- Pass the correct data to each agent task.
- Fail gracefully if required inputs are missing.

---

## 5. Data Sources & Integrations

### 5.1 External Services

- **Agent Services:** Each pipeline agent is a separate microservice or API:
  - `POST /source-scanner/scan` → ingest content
  - `POST /signal-detector/detect` → analyze signals
  - `POST /market-classifier/classify` → map signals to markets
  - ... and so on for all 22 agents.

### 5.2 Data Store

The orchestrator reads and writes to:
- **Pipeline items table:** Core state for opportunities and concepts.
- **Task history table:** Records of every agent task execution.
- **Gate decisions table:** Manual and automatic decisions at each phase boundary.
- **Audit log table:** Complete history of state changes.

### 5.3 Review Dashboard

The orchestrator integrates with the dashboard via:
- **Pull**: Query dashboard for manual overrides/decisions.
- **Push**: Send real-time status updates and events via WebSocket or polling.

### 5.4 Feedback Loop Service

The orchestrator notifies the Feedback Loop of:
- Pipeline outcomes (validated concept, rejected opportunity, etc.).
- Agent failures and their frequency.
- Score distributions and correlation patterns.

---

## 6. Architecture & Design Patterns

### 6.1 Orchestration Pattern: Event-Driven State Machine

The orchestrator is built as an **event-driven state machine**:

- **State:** Each item has immutable state stored in the Data Store (current phase, status, outputs).
- **Events:** State transitions are triggered by events: agent completions, gate decisions, user actions.
- **Handlers:** Each event type has a handler that updates state and emits new events.

This pattern allows:
- Resumability: If the orchestrator crashes, it can recover by replaying recent events.
- Auditability: Every state change is logged as an event.
- Scalability: Events can be published to a message queue for distributed processing.

### 6.2 Work Queue Pattern

- Use a **task queue** (e.g., RabbitMQ, SQS, Kafka) or **in-process scheduler** (e.g., APScheduler, Bull).
- Queue types: `phase-0-queue`, `phase-1-queue`, etc.
- Each queue has configurable concurrency limits and retry policies.
- Dead-letter queues for tasks that fail after max retries.

### 6.3 Timeout & Polling Strategy

For agent tasks:

**Option A: Webhook Callbacks (Recommended for reliability)**
- Orchestrator provides a callback URL with each task.
- Agent calls back when complete (success or failure).
- Orchestrator stores callbacks in memory/Redis for fast lookup.

**Option B: Polling with Exponential Backoff**
- Orchestrator periodically polls each task's status endpoint.
- Start with 1-second polls, back off to 30 seconds.
- Timeout if no completion after 5 minutes.

### 6.4 Retry Strategy

- **Exponential backoff:** 2^retryCount seconds (1s, 2s, 4s, 8s, 16s).
- **Max retries:** 3 attempts per task.
- **Circuit breaker:** If an agent fails repeatedly, stop sending new tasks to it and alert operators.

### 6.5 Concurrency Control

```python
class PipelineOrchestrator:
    def __init__(self):
        self.phase_queues = {
            0: PriorityQueue(maxsize=1000),
            1: PriorityQueue(maxsize=1000),
            2: PriorityQueue(maxsize=1000),
            3: PriorityQueue(maxsize=1000),
        }
        self.in_flight = defaultdict(dict)  # itemId -> {agent: status}
        self.concurrency_limits = {0: 10, 1: 5, 2: 3, 3: 2}

    def can_start_task(self, phase, item_id):
        in_progress_count = sum(1 for status in self.in_flight[phase].values()
                                if status == "in_progress")
        return in_progress_count < self.concurrency_limits[phase]
```

---

## 7. Error Handling & Edge Cases

### 7.1 Agent Failures

**Scenario:** An agent task fails (returns error, times out, or crashes).

**Handling:**
- Log the failure with full context (item ID, phase, step, error message).
- Increment retry counter.
- If retries remain, schedule exponential backoff retry.
- If retries exhausted, set item status to "blocked" and notify Feedback Loop.
- Dashboard should surface blocked items for manual intervention.

### 7.2 Missing Inputs

**Scenario:** A phase is triggered but required input data is missing (e.g., no selected concept for Phase 2).

**Handling:**
- Check prerequisites before queuing.
- If missing, set item to "blocked" with reason "missing_input_<name>".
- Log error to audit trail.
- Alert operator that data is inconsistent.

### 7.3 Circular Dependencies

**Scenario:** Concept A depends on opportunity B, which in turn depends on concept A (cyclic).

**Handling:**
- Detect cycles during dependency resolution (topological sort).
- Mark both items as "blocked" with reason "circular_dependency".
- This should never happen in normal operation (pipeline is DAG), but check for data corruption.

### 7.4 Stalled Items

**Scenario:** An item has been "in_progress" for hours; the task likely hung.

**Handling:**
- Implement a **watchdog timer**: If an item is in_progress for > 5 minutes, assume agent failure.
- Treat as timeout and trigger retry/failure logic.
- Log with high priority for operator review.

### 7.5 Data Corruption

**Scenario:** An item's state in the Data Store is inconsistent (e.g., phase=2 but status=queued which doesn't match).

**Handling:**
- On startup, validate all items in "in_progress" or "blocked" state.
- If a state is invalid, move the item to "blocked" with reason "invalid_state".
- Log for debugging.

### 7.6 Gate Decision Conflicts

**Scenario:** An operator manually approves an item, but the automatic gate logic would reject it.

**Handling:**
- Manual decisions always take precedence.
- Log both the automatic decision and manual override in audit trail.
- Reason field should explain the operator's rationale.

### 7.7 Resource Exhaustion

**Scenario:** Queues are full, memory is high, or downstream services are overloaded.

**Handling:**
- Implement backpressure: Reject new items if any queue exceeds 80% capacity.
- Return 429 (Too Many Requests) to the source (e.g., Phase 0 continuous scan).
- Shed load by pausing lower-priority phases.
- Alert operators to scale up resources.

---

## 8. Performance & Scaling

### 8.1 Expected Throughput

Assuming typical phase durations:

- **Phase 0:** Continuous; ~50–100 new opportunities per week.
- **Phase 1:** ~5 concepts per opportunity (250–500 concepts/week); ~50 selected for Phase 2.
- **Phase 2:** ~30 day duration per concept; ~10–15 validated per week.
- **Phase 3:** ~7 day duration per concept; ~5–10 blueprints completed per week.

### 8.2 Latency Targets

- **Item creation to first step:** < 1 second.
- **Step execution (agent response):** 30 seconds to 1 hour (varies by phase).
- **Gate decision:** < 1 second (automatic) or < 24 hours (manual).
- **Phase completion:** Seconds to days (depending on phase).

### 8.3 Scaling Strategy

- **Horizontal:** Distribute orchestration across multiple instances using Redis for shared state.
  - Elect a leader for gate decisions to avoid conflicts.
  - All instances can enqueue and dequeue items.

- **Vertical:** Use efficient data structures (hash maps, indexes) to minimize memory per item.

- **Database:** Use pagination and indexes on (phase, status, createdAt) for fast queries.

### 8.4 Peak Load Handling

- **Spike scenario:** Phase 0 scanner detects 1000 new opportunities in one hour.
- **Response:**
  - Queue them all to phase-0-queue.
  - Process concurrently (up to limit, e.g., 10 concurrent phase-0 items).
  - Remaining items wait; backpressure applied if queue exceeds capacity.
  - No items are dropped; all are eventually processed.

### 8.5 Monitoring & Metrics

Key metrics to track:

```
- Items in each phase (gauge)
- Items per status (gauge)
- Gate approve/reject rates (counter)
- Task success/failure rates (counter)
- Task latency p50, p95, p99 (histogram)
- Queue depth (gauge)
- Blocked items count (gauge)
- Orchestrator uptime (gauge)
```

---

## 9. Dependencies

### 9.1 Depends On

The orchestrator depends on:

- **Data Store:** For persistent state (items, task history, audit log).
- **All Phase Agents:** For actual work execution (22 agents total).
- **Review Dashboard:** For manual override decisions.
- **Message Queue:** For task distribution (optional but recommended).
- **Redis/Cache:** For in-flight task tracking and distributed state.

### 9.2 Depended On By

Everything depends on the orchestrator:

- **Review Dashboard:** Queries orchestrator for pipeline status.
- **Feedback Loop:** Subscribes to orchestrator events.
- **Data Store:** Receives writes from orchestrator.
- **All Agents:** Receive task instructions from orchestrator.

---

## 10. Success Metrics

How to measure orchestrator health and effectiveness:

1. **Availability:** Orchestrator uptime should be > 99.9% (allowing graceful degradation during restarts).

2. **Throughput:** Items per day progressing through each phase. Example: 10 concepts validated per week (Phase 2 completion rate).

3. **Latency:**
   - P50 latency from item creation to phase start: < 5 seconds.
   - P95 latency from step dispatch to agent response: < 2 minutes (for typical steps).

4. **Reliability:**
   - Task success rate: > 95% on first attempt.
   - Items blocked due to agent failure: < 2% of pipeline.
   - Manual override rate: < 10% of gate decisions (high manual override rates indicate bad automatic scoring).

5. **Auditability:**
   - Every item transition logged with timestamp, actor, reason.
   - Audit trail completeness: 100% of state changes captured.

6. **Scalability:**
   - Linear increase in latency with queue depth up to 1000 items; graceful degradation beyond.
   - Orchestrator CPU/memory constant regardless of queue size (above some threshold, it's dominated by Redis latency).

---

## 11. Implementation Notes

### 11.1 Recommended Tech Stack

**Orchestration Engine:**
- **Python:** APScheduler + FastAPI (for callbacks from agents).
- **Node.js:** Bull (job queue) + Express (for callbacks).
- **Go:** Temporal.io (dedicated workflow orchestration engine, heavyweight but powerful).

**Recommendation:** Use **Bull (Node.js)** for simplicity and dev speed, or **Temporal** if needing advanced features like versioning and durable state.

### 11.2 Key Libraries

- **APScheduler** or **Bull:** Task scheduling and queueing.
- **Redis:** Distributed state, caching, task queue.
- **FastAPI/Express:** HTTP server for agent callbacks.
- **SQLAlchemy/Prisma:** ORM for Data Store access.
- **Pydantic/Joi:** Schema validation for inputs/outputs.
- **Python Logging/Winston:** Structured logging.

### 11.3 Directory Structure

```
orchestrator/
├── main.py                    # Entry point
├── orchestrator.py            # Core orchestration logic
├── state_machine.py           # State machine implementation
├── task_executor.py           # Task dispatch and polling
├── queue_manager.py           # Phase queue management
├── error_handler.py           # Error recovery logic
├── agent_client.py            # HTTP client for agents
├── models.py                  # Data models (Item, Task, Decision, etc.)
├── schemas.py                 # Pydantic schemas for validation
├── routes.py                  # FastAPI routes (callbacks, status, etc.)
├── config.py                  # Configuration (concurrency limits, thresholds, etc.)
├── db.py                      # Database connection and queries
├── tests/
│   ├── test_state_machine.py
│   ├── test_task_executor.py
│   ├── test_queue_manager.py
│   └── test_error_handler.py
└── README.md
```

### 11.4 Pseudocode: Core Loop

```python
class PipelineOrchestrator:
    def __init__(self, data_store, agent_client, queue_manager):
        self.data_store = data_store
        self.agent_client = agent_client
        self.queue_manager = queue_manager
        self.scheduler = APScheduler()

    def start(self):
        # Start job processing for each phase
        for phase in [0, 1, 2, 3]:
            self.scheduler.add_job(
                self.process_phase_queue,
                args=(phase,),
                trigger="interval",
                seconds=1,
                id=f"phase-{phase}-worker"
            )

        # Start watchdog for stalled items
        self.scheduler.add_job(
            self.detect_stalled_items,
            trigger="interval",
            seconds=30,
            id="watchdog"
        )

        self.scheduler.start()

    def process_phase_queue(self, phase):
        """Process one item from the queue for this phase."""
        item = self.queue_manager.dequeue(phase)
        if not item:
            return

        if not self.can_start_task(phase, item.id):
            self.queue_manager.enqueue(phase, item)
            return

        # Get next step for this item
        step = self.get_next_step(item)
        if not step:
            # All steps done, trigger gate
            self.execute_gate(item)
            return

        # Check prerequisites
        if not self.check_prerequisites(item, step):
            self.queue_manager.enqueue(phase, item)
            return

        # Dispatch task to agent
        task = self.create_task(item, step)
        try:
            self.agent_client.dispatch(task)
            self.data_store.mark_task_started(task)
        except Exception as e:
            self.handle_dispatch_error(item, task, e)

    def handle_agent_callback(self, task_id, result):
        """Callback from agent when task completes."""
        task = self.data_store.get_task(task_id)
        item = self.data_store.get_item(task.item_id)

        if result.status == "success":
            self.data_store.save_task_output(task_id, result.output)
            item.status = "in_progress"  # Still in same phase
            self.data_store.update_item(item)
            self.queue_manager.enqueue(item.phase, item)
        else:
            self.handle_agent_failure(item, task, result.error)

    def execute_gate(self, item):
        """Execute gate decision for an item."""
        # Check for manual override
        override = self.data_store.get_manual_decision(item.id)
        if override:
            decision = override.decision
            actor = "human"
        else:
            # Automatic decision based on score
            score_threshold = self.get_threshold(item.phase)
            score = item.data.get("compositeScore", 0)
            decision = "approved" if score >= score_threshold else "rejected"
            actor = "orchestrator"

        self.data_store.record_gate_decision(item.id, item.phase, decision, actor)

        if decision == "approved":
            item.phase += 1
            item.status = "queued"
            self.data_store.update_item(item)
            self.queue_manager.enqueue(item.phase, item)
        else:
            item.status = "rejected"
            self.data_store.update_item(item)
            self.notify_feedback_loop(item, "rejected")

    def detect_stalled_items(self):
        """Find items stuck in 'in_progress' for > 5 minutes."""
        now = datetime.utcnow()
        timeout_threshold = timedelta(minutes=5)

        stalled = self.data_store.query_items(
            status="in_progress",
            updated_before=now - timeout_threshold
        )

        for item in stalled:
            self.handle_timeout(item)
```

### 11.5 Configuration Example

```yaml
# config.yaml
pipeline:
  phases:
    0:
      concurrency_limit: 10
      approval_threshold: 0.70
      step_timeout_seconds: 300
    1:
      concurrency_limit: 5
      approval_threshold: 0.75
      step_timeout_seconds: 300
    2:
      concurrency_limit: 3
      approval_threshold: 0.80
      step_timeout_seconds: 600
    3:
      concurrency_limit: 2
      approval_threshold: null  # No gate; all items complete phase 3
      step_timeout_seconds: 600

task_execution:
  max_retries: 3
  retry_backoff_base_seconds: 2
  callback_timeout_seconds: 300

agents:
  default_timeout_seconds: 300
  endpoints:
    source_scanner: "http://agents.internal/source-scanner"
    signal_detector: "http://agents.internal/signal-detector"
    # ... etc
```

### 11.6 Deployment Considerations

- **Stateless design:** If using distributed orchestration (e.g., multiple instances with Redis), ensure orchestrator is stateless.
- **Database:** Use a transactional database (PostgreSQL) for strong consistency on gate decisions.
- **Message queue:** Use Kafka or RabbitMQ for reliable task distribution if scaled to multiple workers.
- **Monitoring:** Wire up Prometheus metrics and log to ELK or similar.
- **Graceful shutdown:** On shutdown, finish in-flight tasks; queue pending tasks for next startup.

---

## 12. Example Workflow

Here's a concrete example of how the orchestrator manages an opportunity through the pipeline:

1. **T0 (Source Scanner Output):** Phase 0 scanner detects a new market opportunity in logistics automation.
   - Orchestrator creates new item: `opportunity-001`, phase=0, status=queued.

2. **T1 (Phase 0 Execution):** Orchestrator queues signal detection step.
   - Dispatches task to signal-detector agent with the new signal.
   - Agent returns: "Signal detected: AI adoption in supply chain + regulatory push for automation."

3. **T2 (Phase 0 Execution):** Orchestrator queues classification step.
   - Dispatches task to market-classifier agent.
   - Agent maps to market: "Supply Chain Optimization > AI-Powered Fulfillment."

4. **T3 (Phase 0 Execution):** Orchestrator queues ranking step.
   - Dispatches task to opportunity-ranker agent.
   - Agent scores: opportunityScore=0.82 (above threshold of 0.70).

5. **T4 (Phase 0 Gate):** Orchestrator executes gate.
   - No manual override.
   - Automatic rule: score 0.82 >= threshold 0.70 → approved.
   - Advances `opportunity-001` to phase=1, status=queued.

6. **T5 (Phase 1 Execution):** Orchestrator processes Phase 1.
   - Queues landscape-analyst step → returns incumbent analysis.
   - Queues pain-extractor step → returns pain point catalog.
   - Queues concept-generator step → returns 8 concept sketches.
   - Queues concept-scorer step → scores each; top 3 ranked.

7. **T6 (Phase 1 Gate):** Orchestrator executes gate.
   - Manual decision pending: operator reviews top 3 concepts.
   - Operator approves 2 concepts (overrides scorer's ranking).
   - Creates two items: `concept-001` and `concept-002`, both phase=2, status=queued.

8. **T7+ (Phase 2 Execution):** Parallel processing of concept-001 and concept-002.
   - For each concept:
     - market-sizer → TAM/SAM/SOM estimates
     - competitive-analyst → competitor profiles
     - customer-validator → validation evidence
     - feasibility-assessor → technical risks
     - economics-modeler → unit economics
   - Synthesizer produces go/no-go.

9. **T8 (Phase 2 Gate):** If go/no-go="go" with high confidence, advance to Phase 3.

10. **T9+ (Phase 3 Execution):** Generate blueprint.
    - business-designer → business model
    - agent-architect → agent architecture
    - gtm-strategist → go-to-market plan
    - risk-analyst → risk register
    - resource-planner → resource requirements
    - blueprint-packager → final blueprint document.

11. **Completion:** Orchestrator marks item as completed; Blueprint is available in Data Store and visible on Dashboard.

