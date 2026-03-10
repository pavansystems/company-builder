# Data Store — Component Specification

## 1. Purpose & Responsibility

The Data Store is the single source of truth for all pipeline state, intermediate outputs, and historical data in Company Builder. It persists:

- **Pipeline items** (opportunities and concepts) at every phase with their current state.
- **Intermediate outputs** from each agent step (e.g., landscape reports, market sizes, validation summaries).
- **Scoring and decision data** (scores, gate decisions, manual overrides).
- **Audit trails** (who did what, when, why).
- **Historical data** for learning and reprocessing.

The Data Store is not an agent; it is **infrastructure**. It is designed for:

- **Durability:** No data loss, even if the system crashes.
- **Consistency:** Strong ACID guarantees on transactional updates (gate decisions, item state transitions).
- **Auditability:** Complete history of all changes.
- **Queryability:** Fast, indexed access for dashboard views and feedback analysis.
- **Scalability:** Support 1000s of items and 100s of agent outputs.

---

## 2. Inputs

The Data Store receives writes from:

### 2.1 Pipeline Orchestrator

The orchestrator writes:

- **Item creation/updates:** New opportunities, concepts, and state transitions.
  ```json
  {
    "operation": "create" | "update",
    "table": "pipeline_items",
    "data": {
      "id": "uuid",
      "type": "opportunity" | "concept",
      "phase": 0 | 1 | 2 | 3,
      "status": "queued" | "in_progress" | "completed" | "rejected" | "blocked",
      "created_at": "ISO-8601",
      "updated_at": "ISO-8601",
      "phase_data": {...},
      "metadata": {...}
    }
  }
  ```

- **Task history:** Agent task execution records.
  ```json
  {
    "operation": "create",
    "table": "task_history",
    "data": {
      "task_id": "uuid",
      "item_id": "uuid",
      "agent_name": "string",
      "phase": 0 | 1 | 2 | 3,
      "step": "1.4",
      "status": "queued" | "started" | "success" | "failure",
      "input_snapshot": {...},
      "output_snapshot": {...},
      "error_message": "string (nullable)",
      "execution_time_ms": 12000,
      "retry_count": 0,
      "started_at": "ISO-8601",
      "completed_at": "ISO-8601 (nullable)"
    }
  }
  ```

- **Gate decisions:** Automatic and manual go/no-go verdicts.
  ```json
  {
    "operation": "create",
    "table": "gate_decisions",
    "data": {
      "decision_id": "uuid",
      "item_id": "uuid",
      "phase": 0 | 1 | 2,
      "decision": "approved" | "rejected" | "hold",
      "decided_by": "auto" | "userId",
      "decided_at": "ISO-8601",
      "reasoning": "string (nullable)",
      "score_snapshot": {
        "composite_score": 0.82,
        "dimensions": {...}
      }
    }
  }
  ```

- **Audit log entries:** Complete change history.
  ```json
  {
    "operation": "create",
    "table": "audit_log",
    "data": {
      "audit_id": "uuid",
      "timestamp": "ISO-8601",
      "item_id": "uuid",
      "action": "created" | "transitioned" | "rejected" | "overridden" | "comment_added",
      "from_phase": null | 0 | 1 | 2 | 3,
      "to_phase": null | 0 | 1 | 2 | 3,
      "actor_type": "orchestrator" | "user" | "system",
      "actor_id": "string",
      "details": {...}
    }
  }
  ```

### 2.2 Review Dashboard

The dashboard writes:

- **Manual overrides:** Human operators override automatic gate decisions.
  ```json
  {
    "operation": "create",
    "table": "manual_overrides",
    "data": {
      "override_id": "uuid",
      "item_id": "uuid",
      "phase": 0 | 1 | 2,
      "decision": "approved" | "rejected" | "hold",
      "reason": "string",
      "user_id": "uuid",
      "created_at": "ISO-8601"
    }
  }
  ```

- **Comments and annotations:** Human-added notes on items.
  ```json
  {
    "operation": "create",
    "table": "item_comments",
    "data": {
      "comment_id": "uuid",
      "item_id": "uuid",
      "user_id": "uuid",
      "text": "string",
      "created_at": "ISO-8601"
    }
  }
  ```

- **Tags:** User-applied labels.
  ```json
  {
    "operation": "create" | "delete",
    "table": "item_tags",
    "data": {
      "item_id": "uuid",
      "tag": "string"
    }
  }
  ```

### 2.3 Feedback Loop Service

The Feedback Loop writes:

- **Analysis results:** Insights from outcome analysis (e.g., "80% of Phase 0 opportunities in 'healthtech' are validated in Phase 2").
  ```json
  {
    "operation": "create",
    "table": "analysis_results",
    "data": {
      "analysis_id": "uuid",
      "analysis_type": "phase_correlation" | "signal_effectiveness" | "score_calibration",
      "findings": {...},
      "generated_at": "ISO-8601"
    }
  }
  ```

- **Model updates:** Versioned scoring models.
  ```json
  {
    "operation": "create",
    "table": "model_versions",
    "data": {
      "model_id": "uuid",
      "model_name": "opportunity_scorer_v2",
      "version": "2.0.1",
      "parameters": {...},
      "metrics": {...},
      "created_at": "ISO-8601"
    }
  }
  ```

---

## 3. Outputs

The Data Store provides read access to:

### 3.1 Pipeline Orchestrator

Queries:

- Get item by ID: `SELECT * FROM pipeline_items WHERE id = ?`
- List items in phase: `SELECT * FROM pipeline_items WHERE phase = ? ORDER BY updated_at DESC`
- Get all tasks for item: `SELECT * FROM task_history WHERE item_id = ?`
- Check for manual override: `SELECT * FROM manual_overrides WHERE item_id = ? LIMIT 1`
- Get audit trail: `SELECT * FROM audit_log WHERE item_id = ? ORDER BY timestamp DESC`

### 3.2 Review Dashboard

Queries (and cached/materialized views):

- **Pipeline summary:** Count of items per phase per status.
  ```sql
  SELECT phase, status, COUNT(*) as count
  FROM pipeline_items
  GROUP BY phase, status
  ```

- **Recent items:** Latest 50 items across all phases.
  ```sql
  SELECT id, type, phase, status, name, updated_at
  FROM pipeline_items
  ORDER BY updated_at DESC
  LIMIT 50
  ```

- **Item detail view:** Full item with all outputs, comments, tags, decisions.
  ```sql
  SELECT
    pi.*,
    GROUP_CONCAT(DISTINCT ic.text) as comments,
    GROUP_CONCAT(DISTINCT it.tag) as tags,
    gd.decision as last_gate_decision
  FROM pipeline_items pi
  LEFT JOIN item_comments ic ON pi.id = ic.item_id
  LEFT JOIN item_tags it ON pi.id = it.item_id
  LEFT JOIN gate_decisions gd ON pi.id = gd.item_id AND gd.phase = pi.phase
  WHERE pi.id = ?
  ```

- **Blocked items:** Items stuck with reason.
  ```sql
  SELECT id, phase, status, updated_at, blocking_reason
  FROM pipeline_items
  WHERE status IN ('blocked', 'failed')
  ORDER BY updated_at DESC
  ```

### 3.3 Feedback Loop Service

Queries:

- **Phase outcomes:** How many items were approved/rejected at each gate.
  ```sql
  SELECT phase, decision, COUNT(*) as count
  FROM gate_decisions
  GROUP BY phase, decision
  ```

- **Score distributions:** Distribution of scores in each phase.
  ```sql
  SELECT
    phase,
    percentile_cont(0.25) WITHIN GROUP (ORDER BY composite_score) as p25,
    percentile_cont(0.50) WITHIN GROUP (ORDER BY composite_score) as p50,
    percentile_cont(0.75) WITHIN GROUP (ORDER BY composite_score) as p75,
    AVG(composite_score) as avg_score
  FROM phase_scores
  GROUP BY phase
  ```

- **Agent success rates:** Task success/failure broken down by agent.
  ```sql
  SELECT
    agent_name,
    status,
    COUNT(*) as count,
    AVG(execution_time_ms) as avg_duration
  FROM task_history
  GROUP BY agent_name, status
  ```

- **Concept outcomes:** Which concepts were validated vs. rejected.
  ```sql
  SELECT
    concept_id,
    concept_name,
    phase_2_validation_result,
    validation_confidence
  FROM pipeline_items
  WHERE type = 'concept' AND phase >= 2
  ```

---

## 4. Core Logic / Algorithm

### 4.1 Data Model

**Relational Schema:**

```sql
-- Pipeline items: opportunities and concepts
CREATE TABLE pipeline_items (
  id UUID PRIMARY KEY,
  type ENUM('opportunity', 'concept'),
  phase INTEGER CHECK (phase BETWEEN 0 AND 3),
  status ENUM('queued', 'in_progress', 'completed', 'rejected', 'blocked'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  parent_item_id UUID REFERENCES pipeline_items(id),  -- For concepts linked to opportunities
  phase_data JSONB,  -- Phase-specific data
  metadata JSONB,    -- User tags, priority, etc.

  INDEX idx_phase_status (phase, status),
  INDEX idx_updated_at (updated_at),
  INDEX idx_parent_item (parent_item_id)
);

-- Agent task execution history
CREATE TABLE task_history (
  task_id UUID PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES pipeline_items(id),
  agent_name VARCHAR(100),
  phase INTEGER,
  step VARCHAR(10),  -- e.g., "1.4"
  status ENUM('queued', 'started', 'success', 'failure', 'timeout'),
  input_snapshot JSONB,
  output_snapshot JSONB,
  error_message TEXT,
  execution_time_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  INDEX idx_item_id (item_id),
  INDEX idx_agent_name (agent_name),
  INDEX idx_status (status),
  INDEX idx_completed_at (completed_at)
);

-- Gate decisions (manual and automatic)
CREATE TABLE gate_decisions (
  decision_id UUID PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES pipeline_items(id),
  phase INTEGER CHECK (phase IN (0, 1, 2)),
  decision ENUM('approved', 'rejected', 'hold'),
  decided_by ENUM('auto', 'user'),
  user_id UUID,
  decided_at TIMESTAMP,
  reasoning TEXT,
  composite_score DECIMAL(5, 3),
  score_dimensions JSONB,

  INDEX idx_item_id (item_id),
  INDEX idx_phase_decision (phase, decision),
  INDEX idx_decided_at (decided_at)
);

-- Audit log
CREATE TABLE audit_log (
  audit_id UUID PRIMARY KEY,
  timestamp TIMESTAMP,
  item_id UUID REFERENCES pipeline_items(id),
  action ENUM('created', 'transitioned', 'rejected', 'overridden', 'comment_added', 'tag_added'),
  from_phase INTEGER,
  to_phase INTEGER,
  actor_type ENUM('orchestrator', 'user', 'system'),
  actor_id VARCHAR(100),
  details JSONB,

  INDEX idx_item_id (item_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_action (action)
);

-- Manual overrides
CREATE TABLE manual_overrides (
  override_id UUID PRIMARY KEY,
  item_id UUID NOT NULL UNIQUE REFERENCES pipeline_items(id),  -- One override per item
  phase INTEGER CHECK (phase IN (0, 1, 2)),
  decision ENUM('approved', 'rejected', 'hold'),
  reason TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP,

  INDEX idx_item_id (item_id),
  INDEX idx_user_id (user_id)
);

-- Comments
CREATE TABLE item_comments (
  comment_id UUID PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES pipeline_items(id),
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP,

  INDEX idx_item_id (item_id),
  INDEX idx_user_id (user_id)
);

-- Tags
CREATE TABLE item_tags (
  item_id UUID NOT NULL REFERENCES pipeline_items(id),
  tag VARCHAR(50) NOT NULL,
  PRIMARY KEY (item_id, tag),

  INDEX idx_tag (tag)
);

-- Analysis results (from Feedback Loop)
CREATE TABLE analysis_results (
  analysis_id UUID PRIMARY KEY,
  analysis_type VARCHAR(100),
  phase INTEGER,
  findings JSONB,
  generated_at TIMESTAMP,

  INDEX idx_analysis_type (analysis_type),
  INDEX idx_generated_at (generated_at)
);

-- Model versions (scoring models used by agents)
CREATE TABLE model_versions (
  model_id UUID PRIMARY KEY,
  model_name VARCHAR(100),
  version VARCHAR(20),
  parameters JSONB,
  metrics JSONB,
  created_at TIMESTAMP,

  INDEX idx_model_name_version (model_name, version)
);
```

### 4.2 Write Operations

**Create Item:**
```python
def create_item(item_type, phase, metadata):
    item = PipelineItem(
        id=uuid4(),
        type=item_type,
        phase=phase,
        status="queued",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        phase_data={},
        metadata=metadata
    )
    db.session.add(item)
    db.session.commit()

    # Log creation
    log_audit("created", item.id, actor="orchestrator", from_phase=None, to_phase=phase)

    return item
```

**Update Item State:**
```python
def update_item_state(item_id, new_phase=None, new_status=None, phase_data_update=None):
    item = db.session.query(PipelineItem).filter_by(id=item_id).first()
    old_phase = item.phase
    old_status = item.status

    if new_phase is not None:
        item.phase = new_phase
    if new_status is not None:
        item.status = new_status
    if phase_data_update:
        item.phase_data.update(phase_data_update)

    item.updated_at = datetime.utcnow()
    db.session.commit()

    # Log transition
    if old_phase != item.phase:
        log_audit("transitioned", item.id, from_phase=old_phase, to_phase=item.phase)
    if old_status != item.status:
        log_audit("status_changed", item.id, details={"from": old_status, "to": item.status})
```

**Record Task Execution:**
```python
def record_task_execution(task_id, item_id, agent_name, phase, step, status,
                         input_snapshot, output_snapshot=None, error=None, duration_ms=None):
    task = TaskHistory(
        task_id=task_id,
        item_id=item_id,
        agent_name=agent_name,
        phase=phase,
        step=step,
        status=status,
        input_snapshot=input_snapshot,
        output_snapshot=output_snapshot,
        error_message=error,
        execution_time_ms=duration_ms,
        started_at=datetime.utcnow() if status == "started" else None,
        completed_at=datetime.utcnow() if status in ("success", "failure") else None
    )
    db.session.add(task)
    db.session.commit()
```

**Record Gate Decision:**
```python
def record_gate_decision(item_id, phase, decision, decided_by, reasoning=None,
                        composite_score=None, score_dimensions=None):
    # Check for existing manual override
    override = db.session.query(ManualOverride).filter_by(item_id=item_id).first()

    if override:
        decision = override.decision
        decided_by = "user"
        user_id = override.user_id
    else:
        user_id = None

    gate_decision = GateDecision(
        decision_id=uuid4(),
        item_id=item_id,
        phase=phase,
        decision=decision,
        decided_by=decided_by,
        user_id=user_id,
        decided_at=datetime.utcnow(),
        reasoning=reasoning,
        composite_score=composite_score,
        score_dimensions=score_dimensions
    )
    db.session.add(gate_decision)
    db.session.commit()

    log_audit("gate_decision", item_id, details={
        "phase": phase,
        "decision": decision,
        "decided_by": decided_by
    })
```

### 4.3 Read Operations

**Get Item with all related data:**
```python
def get_item_detail(item_id):
    item = db.session.query(PipelineItem).filter_by(id=item_id).first()
    if not item:
        return None

    # Fetch related data
    tasks = db.session.query(TaskHistory).filter_by(item_id=item_id).all()
    gate_decisions = db.session.query(GateDecision).filter_by(item_id=item_id).all()
    comments = db.session.query(ItemComment).filter_by(item_id=item_id).all()
    tags = db.session.query(ItemTag).filter_by(item_id=item_id).all()
    audit_trail = db.session.query(AuditLog).filter_by(item_id=item_id).order_by(
        AuditLog.timestamp.desc()
    ).all()

    return {
        "item": item,
        "tasks": tasks,
        "gate_decisions": gate_decisions,
        "comments": comments,
        "tags": tags,
        "audit_trail": audit_trail
    }
```

**Pipeline Summary:**
```python
def get_pipeline_summary():
    summary = {}
    for phase in range(4):
        counts = db.session.query(
            PipelineItem.status,
            func.count(PipelineItem.id).label('count')
        ).filter_by(phase=phase).group_by(PipelineItem.status).all()

        summary[f"phase_{phase}"] = {row.status: row.count for row in counts}

    return summary
```

### 4.4 Consistency & Transactions

**Transactional Gate Decision:**

```python
@db.transaction  # Wrapped in ACID transaction
def execute_gate_transaction(item_id, phase):
    """
    Atomically record gate decision and update item state.
    Prevents race conditions where item could advance and override occurs simultaneously.
    """

    # Lock the item row
    item = db.session.query(PipelineItem).with_for_update().filter_by(id=item_id).first()

    # Check for manual override
    override = db.session.query(ManualOverride).filter_by(item_id=item_id).first()

    if override:
        decision = override.decision
    else:
        # Automatic decision
        score = item.phase_data.get("compositeScore", 0)
        threshold = get_threshold(phase)
        decision = "approved" if score >= threshold else "rejected"

    # Record decision
    gate_decision = GateDecision(...decision...)
    db.session.add(gate_decision)

    # Update item
    if decision == "approved":
        item.phase = phase + 1
        item.status = "queued"
    else:
        item.status = "rejected"

    item.updated_at = datetime.utcnow()

    # Commit all together
    db.session.commit()
```

### 4.5 Partitioning Strategy (for scale)

For very large datasets, partition tables by phase or time:

```sql
-- Partition pipeline_items by phase
CREATE TABLE pipeline_items_p0 PARTITION OF pipeline_items FOR VALUES IN (0);
CREATE TABLE pipeline_items_p1 PARTITION OF pipeline_items FOR VALUES IN (1);
CREATE TABLE pipeline_items_p2 PARTITION OF pipeline_items FOR VALUES IN (2);
CREATE TABLE pipeline_items_p3 PARTITION OF pipeline_items FOR VALUES IN (3);

-- Partition task_history by month
CREATE TABLE task_history_2026_01 PARTITION OF task_history
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE task_history_2026_02 PARTITION OF task_history
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

---

## 5. Data Sources & Integrations

### 5.1 External Integrations

The Data Store does not call external services; it is write-only from internal components. However, it may integrate with:

- **Backup service:** Continuous or daily snapshots to S3/cloud storage.
- **Analytics warehouse:** Periodic ETL to export data for analysis (via Feedback Loop).

### 5.2 Internal Integrations

- **Orchestrator:** Primary write source.
- **Dashboard:** Read queries and write (comments, tags, overrides).
- **Feedback Loop:** Read queries for analysis.

---

## 6. Architecture & Design Patterns

### 6.1 Storage Engine

**Primary Database:** PostgreSQL

- ACID transactions for consistency.
- JSON/JSONB for flexible schema (phase_data, metadata, etc.).
- Indexes on frequently queried columns.
- Partitioning for large tables.

**Caching Layer:** Redis

- Cache materialized views (pipeline summary, recent items).
- Cache frequently accessed items (LRU, 1-hour TTL).
- Invalidate on writes via orchestrator.

**Backup:** S3-compatible object storage
- Daily snapshots of database (pg_dump).
- Point-in-time recovery capability (backup+WAL).

### 6.2 Write Pattern

**Write-Ahead Logging (WAL):**
- Database writes via WAL ensure durability.
- Even if process crashes, writes are recoverable.

**Idempotency:**
- All write operations are idempotent by ID.
- If the same task is recorded twice (network retry), only one row is created (unique constraint).

```python
# Idempotent write example
CREATE UNIQUE INDEX idx_task_id ON task_history(task_id);

def record_task_execution(task_id, ...):
    try:
        db.insert(TaskHistory(task_id=task_id, ...))
    except IntegrityError:
        # Task already recorded; no-op
        pass
```

### 6.3 Query Optimization

**Indexing Strategy:**

- Index all foreign keys and frequently filtered columns (phase, status, agent_name).
- Index commonly sorted columns (updated_at, timestamp).
- Use partial indexes for filtered queries (e.g., `WHERE status = 'blocked'`).

```sql
CREATE INDEX idx_blocked_items ON pipeline_items(updated_at)
  WHERE status IN ('blocked', 'failed');
```

**Query Plans:**

- EXPLAIN queries before deployment.
- Avoid full table scans; use indexes.
- Batch queries when possible (use IN instead of multiple queries).

### 6.4 Multi-Tenancy (Optional)

If supporting multiple organizations:

```sql
ALTER TABLE pipeline_items ADD COLUMN org_id UUID NOT NULL;
ALTER TABLE audit_log ADD COLUMN org_id UUID NOT NULL;

-- Update indexes
CREATE INDEX idx_org_phase_status ON pipeline_items(org_id, phase, status);

-- Row-level security (RLS)
ALTER TABLE pipeline_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON pipeline_items
  USING (org_id = current_setting('app.org_id')::uuid);
```

---

## 7. Error Handling & Edge Cases

### 7.1 Concurrent Writes

**Scenario:** Orchestrator and Dashboard both try to update item state simultaneously.

**Handling:**
- Use database-level locking (FOR UPDATE).
- Orchestrator has precedence; dashboard writes fail gracefully.
- Dashboard retries with exponential backoff.

### 7.2 Data Corruption

**Scenario:** Invalid data is written (e.g., phase=5 when max is 3).

**Handling:**
- Database constraints prevent invalid data (CHECK constraints, enums).
- Application-level validation before writes.
- Read operation returns error if data is corrupted; operators alerted.

### 7.3 Orphaned Records

**Scenario:** An item is deleted, but tasks still reference it.

**Handling:**
- Use cascading deletes (ON DELETE CASCADE).
- Foreign key constraints prevent orphans.
- Audit trail is never deleted (soft deletes if needed for compliance).

### 7.4 Clock Skew

**Scenario:** Server clocks are not synchronized; timestamps are inconsistent.

**Handling:**
- All timestamps use UTC.
- Use database server's timestamp for critical records (NOW() in SQL, not application time).
- Monitor clock drift; alert if skew > 1 second.

### 7.5 Storage Exhaustion

**Scenario:** Database runs out of disk space.

**Handling:**
- Monitor disk usage; alert at 80%.
- Implement data archival: Move old items to archive table (reads still work via view).
- Maintain daily backups; recovery is possible.

---

## 8. Performance & Scaling

### 8.1 Query Performance Targets

- **Point query (get item by ID):** < 10 ms.
- **Summary query (pipeline counts):** < 100 ms (cached).
- **Detail query (item + tasks + comments):** < 500 ms.
- **Audit trail query (100 records):** < 200 ms.

### 8.2 Throughput

Assuming 50–100 new items per week, 5 items per opportunity, 22 tasks per concept:

- **Writes:** ~500 items/week + ~5000 tasks/week = ~1 write/second on average.
- **Reads:** Dashboard queries (10 req/sec during business hours), Feedback Loop batch queries (1 req/min).

**Database capacity:** Current schema supports 1M items, 10M tasks without issue. Partitioning needed around 10M items.

### 8.3 Caching Strategy

```python
class DataStore:
    def __init__(self, db, cache):
        self.db = db
        self.cache = cache  # Redis

    def get_item(self, item_id):
        # Check cache first
        cached = self.cache.get(f"item:{item_id}")
        if cached:
            return cached

        # Fetch from DB
        item = self.db.query(PipelineItem).get(item_id)

        # Cache for 1 hour
        self.cache.setex(f"item:{item_id}", 3600, item)

        return item

    def update_item(self, item):
        # Update DB
        self.db.update(item)

        # Invalidate cache
        self.cache.delete(f"item:{item.id}")

        # Invalidate summary cache
        self.cache.delete("pipeline_summary")
```

### 8.4 Scaling Beyond Single Database

**Read Replicas:**
- Use read replicas for analytics and dashboard queries.
- Orchestrator (writes) uses primary; dashboard can use replica (slightly stale data is acceptable).

**Sharding (if needed):**
- Shard by item_id (hash-based or range-based).
- Orchestrator routes to correct shard.
- Complex queries across shards (e.g., phase summary) use a coordinator.

---

## 9. Dependencies

### 9.1 Depends On

- **PostgreSQL** (or compatible RDBMS): Primary storage.
- **Redis** (optional): Caching layer.
- **S3/Object Storage** (optional): Backups.

### 9.2 Depended On By

- **Pipeline Orchestrator:** Queries and writes pipeline state.
- **Review Dashboard:** Queries pipeline summary and item details; writes overrides and comments.
- **Feedback Loop Service:** Queries phase outcomes and score distributions; writes analysis results.

---

## 10. Success Metrics

### 10.1 Data Integrity

- **No data loss:** Zero writes dropped or lost between application and disk (verified via backups).
- **Audit trail completeness:** 100% of state changes logged.
- **Constraint violations:** < 0.1% (invalid data prevented by schema).

### 10.2 Performance

- **P50 query latency:** < 50 ms (non-cached).
- **P95 query latency:** < 200 ms.
- **Throughput:** Support 100+ writes per second without degradation.

### 10.3 Availability

- **Uptime:** > 99.9% (maintenance windows excluded).
- **Mean time to recovery:** < 5 minutes (from backup).

### 10.4 Observability

- **Query monitoring:** Can identify slow queries via pg_stat_statements.
- **Write monitoring:** Can track write latency and throughput.
- **Storage monitoring:** Disk usage, growth rate, capacity planning visible.

---

## 11. Implementation Notes

### 11.1 Recommended Tech Stack

**Database:**
- **PostgreSQL 15+:** JSONB, partitioning, RLS, excellent for this use case.
- **SQLAlchemy:** ORM for Python (or Prisma for Node.js).

**Caching:**
- **Redis:** Fast, in-memory cache for materialized views and item caching.

**Backup:**
- **pg_basebackup + WAL archiving:** Native PostgreSQL backup.
- **AWS RDS automated snapshots:** If using managed database.

**Monitoring:**
- **Prometheus:** Query latency, transaction counts.
- **Grafana:** Dashboards for database health.
- **pg_stat_statements:** Identify slow queries.

### 11.2 Directory Structure

```
data-store/
├── main.py                    # Entry point
├── models.py                  # SQLAlchemy models
├── database.py                # DB connection and setup
├── cache.py                   # Redis caching layer
├── queries.py                 # Common queries
├── migrations/
│   ├── alembic.ini
│   └── versions/
│       ├── 001_initial_schema.py
│       ├── 002_add_indexes.py
│       └── ...
├── tests/
│   ├── test_models.py
│   ├── test_queries.py
│   └── test_consistency.py
└── README.md
```

### 11.3 Schema Migration Example

Using Alembic (SQLAlchemy migration tool):

```python
# migrations/versions/001_initial_schema.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'pipeline_items',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('type', sa.String(20)),
        sa.Column('phase', sa.Integer),
        sa.Column('status', sa.String(20)),
        sa.Column('created_at', sa.DateTime),
        sa.Column('updated_at', sa.DateTime),
        sa.Column('phase_data', sa.JSON),
        sa.Column('metadata', sa.JSON),
    )
    op.create_index('idx_phase_status', 'pipeline_items', ['phase', 'status'])

def downgrade():
    op.drop_table('pipeline_items')
```

### 11.4 Example Queries

```python
# Get pipeline summary (cached)
def get_pipeline_summary():
    cache_key = "pipeline_summary"
    cached = cache.get(cache_key)
    if cached:
        return cached

    summary = {}
    for phase in range(4):
        counts = db.session.query(
            PipelineItem.status,
            func.count(PipelineItem.id).label('count')
        ).filter_by(phase=phase).group_by(PipelineItem.status).all()

        summary[f"phase_{phase}"] = {row.status: row.count for row in counts}

    cache.setex(cache_key, 300, summary)  # Cache for 5 minutes
    return summary

# Get recent items across all phases
def get_recent_items(limit=50):
    return db.session.query(
        PipelineItem.id, PipelineItem.type, PipelineItem.phase,
        PipelineItem.status, PipelineItem.metadata['name'].astext.label('name'),
        PipelineItem.updated_at
    ).order_by(PipelineItem.updated_at.desc()).limit(limit).all()

# Get item detail (with all related data)
def get_item_detail(item_id):
    item = db.session.query(PipelineItem).get(item_id)
    tasks = db.session.query(TaskHistory).filter_by(item_id=item_id).all()
    gate_decisions = db.session.query(GateDecision).filter_by(item_id=item_id).all()
    comments = db.session.query(ItemComment).filter_by(item_id=item_id).all()
    audit = db.session.query(AuditLog).filter_by(item_id=item_id).order_by(
        AuditLog.timestamp.desc()
    ).all()

    return {
        "item": item,
        "tasks": tasks,
        "gate_decisions": gate_decisions,
        "comments": comments,
        "audit_trail": audit
    }

# Phase outcome analysis (for Feedback Loop)
def get_phase_outcomes(phase):
    outcomes = db.session.query(
        GateDecision.decision,
        func.count(GateDecision.decision_id).label('count'),
        func.avg(GateDecision.composite_score).label('avg_score')
    ).filter_by(phase=phase).group_by(GateDecision.decision).all()

    return {row.decision: {"count": row.count, "avg_score": row.avg_score} for row in outcomes}
```

### 11.5 Deployment Checklist

- [ ] PostgreSQL 15+ installed and running.
- [ ] Alembic migrations applied.
- [ ] Indexes created (may take time on large tables).
- [ ] Redis instance deployed (if using caching).
- [ ] Backup strategy configured (pg_basebackup + S3 upload).
- [ ] Monitoring (Prometheus, Grafana) configured.
- [ ] Connection pooling enabled (PgBouncer recommended for high concurrency).
- [ ] Read replicas set up for analytics.
- [ ] RLS policies enabled (if multi-tenant).

### 11.6 Disaster Recovery Plan

- **RPO (Recovery Point Objective):** 15 minutes (backup every 15 min).
- **RTO (Recovery Time Objective):** 5 minutes (restore from backup and replay WAL).
- **Backup location:** Multi-region S3 (cross-region replication).
- **Test restores:** Monthly restore test to verify backup integrity.

---

## 12. Example Data

Here's sample data to understand structure:

```json
// Pipeline Item (Opportunity)
{
  "id": "opp-001",
  "type": "opportunity",
  "phase": 1,
  "status": "in_progress",
  "created_at": "2026-03-01T10:00:00Z",
  "updated_at": "2026-03-05T14:30:00Z",
  "phase_data": {
    "market": "Supply Chain Optimization",
    "problem": "Manual inventory management in logistics",
    "enablingSignals": ["LLM API price drop", "Warehouse automation adoption"],
    "agentReadiness": 0.85,
    "estimatedMarketSize": "$50B TAM",
    "competitiveDensity": "medium",
    "opportunityScore": 0.82
  },
  "metadata": {
    "priority": "high",
    "tags": ["logistics", "ai-ready"],
    "userId": "user-123"
  }
}

// Task History (Agent Execution)
{
  "task_id": "task-0001",
  "item_id": "opp-001",
  "agent_name": "signal-detector",
  "phase": 0,
  "step": "0.2",
  "status": "success",
  "input_snapshot": {
    "content": "News: Major logistics provider adopts AI inventory system",
    "source": "TechCrunch"
  },
  "output_snapshot": {
    "signals": [
      {
        "type": "tech_breakthrough",
        "description": "LLM APIs now accurate for supply chain prediction",
        "severity": "high"
      }
    ]
  },
  "execution_time_ms": 2450,
  "started_at": "2026-03-01T10:00:00Z",
  "completed_at": "2026-03-01T10:04:10Z"
}

// Gate Decision
{
  "decision_id": "gate-001",
  "item_id": "opp-001",
  "phase": 0,
  "decision": "approved",
  "decided_by": "auto",
  "decided_at": "2026-03-05T14:30:00Z",
  "composite_score": 0.82,
  "score_dimensions": {
    "market_size": 0.85,
    "signal_strength": 0.90,
    "competitive_density": 0.70,
    "timing_confidence": 0.80
  }
}

// Audit Log Entry
{
  "audit_id": "audit-001",
  "timestamp": "2026-03-05T14:30:00Z",
  "item_id": "opp-001",
  "action": "transitioned",
  "from_phase": 0,
  "to_phase": 1,
  "actor_type": "orchestrator",
  "actor_id": "pipeline-orchestrator",
  "details": {
    "reason": "Gate approved with score 0.82",
    "threshold": 0.70
  }
}
```

