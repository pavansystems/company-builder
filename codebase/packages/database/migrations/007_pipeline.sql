-- Migration 007: Pipeline Orchestration
-- Pipeline items, gate decisions, and gate rules tables

CREATE TABLE IF NOT EXISTS pipeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Item identity
  item_type VARCHAR(50),
  source_id UUID,
  market_opportunity_id UUID REFERENCES market_opportunities(id),
  concept_id UUID REFERENCES concepts(id),

  -- Pipeline state
  current_phase VARCHAR(50),
  current_step VARCHAR(50),
  status VARCHAR(50),

  -- Gate decisions
  last_gate_decision VARCHAR(50),
  last_gate_at TIMESTAMPTZ,
  last_gate_reason TEXT,
  last_gate_by UUID REFERENCES auth.users(id),

  -- Timing
  entered_phase_at TIMESTAMPTZ,
  entered_step_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Tags and notes
  tags JSONB,
  priority VARCHAR(20),

  CONSTRAINT item_type_valid CHECK (item_type IN ('opportunity', 'concept', 'validation', 'blueprint')),
  CONSTRAINT phase_valid CHECK (current_phase IN ('phase_0', 'phase_1', 'phase_2', 'phase_3', 'rejected', 'archived')),
  CONSTRAINT status_valid CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'blocked')),
  CONSTRAINT priority_valid CHECK (priority IN ('low', 'normal', 'high'))
);

CREATE INDEX IF NOT EXISTS idx_pipeline_phase ON pipeline_items(current_phase);
CREATE INDEX IF NOT EXISTS idx_pipeline_status ON pipeline_items(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_concept ON pipeline_items(concept_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_market_opp ON pipeline_items(market_opportunity_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_entered_phase ON pipeline_items(entered_phase_at DESC);

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gate_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Gate identity
  gate_phase VARCHAR(50),
  pipeline_item_id UUID NOT NULL REFERENCES pipeline_items(id),

  -- Decision
  decision VARCHAR(50) NOT NULL,
  decision_by UUID REFERENCES auth.users(id),
  decision_reason TEXT,

  -- Context
  pre_decision_data JSONB,
  override_reason TEXT,

  -- Timestamps
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT decision_valid CHECK (decision IN ('pass', 'fail', 'override_pass', 'override_fail'))
);

CREATE INDEX IF NOT EXISTS idx_gate_decisions_pipeline ON gate_decisions(pipeline_item_id);
CREATE INDEX IF NOT EXISTS idx_gate_decisions_decided_at ON gate_decisions(decided_at DESC);
CREATE INDEX IF NOT EXISTS idx_gate_decisions_phase ON gate_decisions(gate_phase);

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gate_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_from VARCHAR(50) NOT NULL,
  phase_to VARCHAR(50) NOT NULL,
  gate_type VARCHAR(50) NOT NULL,
  high_threshold NUMERIC(5,2) NOT NULL,
  low_threshold NUMERIC(5,2) NOT NULL,
  config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(phase_from, phase_to),
  CONSTRAINT gate_type_valid CHECK (gate_type IN ('automatic', 'manual', 'hybrid')),
  CONSTRAINT threshold_order CHECK (high_threshold > low_threshold),
  CONSTRAINT high_threshold_range CHECK (high_threshold >= 0.0 AND high_threshold <= 100.0),
  CONSTRAINT low_threshold_range CHECK (low_threshold >= 0.0 AND low_threshold <= 100.0)
);

CREATE TRIGGER gate_rules_updated_at
  BEFORE UPDATE ON gate_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Database functions for pipeline management

CREATE OR REPLACE FUNCTION advance_pipeline_state(
  p_pipeline_item_id UUID,
  p_new_phase VARCHAR,
  p_new_step VARCHAR,
  p_new_status VARCHAR
)
RETURNS TABLE (
  updated_at TIMESTAMPTZ,
  current_phase VARCHAR,
  current_step VARCHAR,
  status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  UPDATE pipeline_items
  SET
    current_phase = p_new_phase,
    current_step = p_new_step,
    status = p_new_status,
    entered_phase_at = CASE WHEN current_phase IS DISTINCT FROM p_new_phase THEN NOW() ELSE entered_phase_at END,
    entered_step_at = NOW()
  WHERE id = p_pipeline_item_id
  RETURNING NOW(), pipeline_items.current_phase, pipeline_items.current_step, pipeline_items.status;
END;
$$ LANGUAGE plpgsql;
