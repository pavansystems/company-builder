-- Migration 009: Agent Runs
-- Audit log of every agent execution

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Agent identity
  agent_name VARCHAR(255) NOT NULL,
  agent_version VARCHAR(50),
  triggered_by VARCHAR(50),

  -- Related pipeline item
  pipeline_item_id UUID REFERENCES pipeline_items(id),

  -- Execution details
  input_data JSONB,
  output_data JSONB,
  status VARCHAR(50) NOT NULL,
  error_message TEXT,

  -- Resource usage
  execution_duration_seconds INT,
  tokens_input INT,
  tokens_output INT,
  cost_usd NUMERIC(8,4),

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT status_valid CHECK (status IN ('success', 'partial', 'failed', 'timeout')),
  CONSTRAINT triggered_by_valid CHECK (triggered_by IN ('orchestrator', 'webhook', 'manual', 'schedule')),
  CONSTRAINT cost_non_negative CHECK (cost_usd IS NULL OR cost_usd >= 0),
  CONSTRAINT tokens_non_negative_input CHECK (tokens_input IS NULL OR tokens_input >= 0),
  CONSTRAINT tokens_non_negative_output CHECK (tokens_output IS NULL OR tokens_output >= 0)
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_agent ON agent_runs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_started ON agent_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_pipeline ON agent_runs(pipeline_item_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_completed ON agent_runs(completed_at DESC);
