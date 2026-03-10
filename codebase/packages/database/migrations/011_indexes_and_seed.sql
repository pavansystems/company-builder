-- Migration 011: Additional Indexes and Seed Data
-- Performance indexes and default gate rules

-- ---------------------------------------------------------------------------
-- Additional composite indexes for common query patterns
-- ---------------------------------------------------------------------------

-- content_items: source + date range queries
CREATE INDEX IF NOT EXISTS idx_content_items_source_published
  ON content_items(source_id, published_at DESC);

-- signals: active signals by type for detection pipeline
CREATE INDEX IF NOT EXISTS idx_signals_type_confidence
  ON signals(signal_type, confidence DESC)
  WHERE is_archived = FALSE;

-- market_opportunities: industry + active for Phase 0 ranking
CREATE INDEX IF NOT EXISTS idx_market_opp_industry_active
  ON market_opportunities(target_industry, is_active)
  WHERE is_active = TRUE;

-- concepts: opportunity + active for Phase 1 generation
CREATE INDEX IF NOT EXISTS idx_concepts_opp_active
  ON concepts(market_opportunity_id, is_active)
  WHERE is_active = TRUE;

-- concepts: status composite for pipeline queries
CREATE INDEX IF NOT EXISTS idx_concepts_selected_active
  ON concepts(selected_for_validation, is_active);

-- validations: concept + phase for Phase 2 orchestration
CREATE INDEX IF NOT EXISTS idx_validations_concept_phase
  ON validations(concept_id, validation_phase);

-- validations: verdict + confidence for gate evaluation
CREATE INDEX IF NOT EXISTS idx_validations_verdict_confidence
  ON validations(verdict, confidence DESC);

-- pipeline_items: status + phase composite for orchestrator
CREATE INDEX IF NOT EXISTS idx_pipeline_status_phase
  ON pipeline_items(status, current_phase);

-- pipeline_items: active items (not rejected/archived)
CREATE INDEX IF NOT EXISTS idx_pipeline_active
  ON pipeline_items(status, current_phase)
  WHERE status IN ('pending', 'in_progress', 'blocked') AND current_phase NOT IN ('rejected', 'archived');

-- agent_runs: agent + date for cost monitoring
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_started
  ON agent_runs(agent_name, started_at DESC);

-- agent_runs: pipeline item + status for orchestrator
CREATE INDEX IF NOT EXISTS idx_agent_runs_pipeline_status
  ON agent_runs(pipeline_item_id, status);

-- opportunity_scores: latest score per opportunity
CREATE INDEX IF NOT EXISTS idx_opp_scores_opp_latest
  ON opportunity_scores(market_opportunity_id, scored_at DESC);

-- concept_scores: latest score per concept
CREATE INDEX IF NOT EXISTS idx_concept_scores_concept_latest
  ON concept_scores(concept_id, scored_at DESC);

-- gate_decisions: pipeline + date for audit trail
CREATE INDEX IF NOT EXISTS idx_gate_decisions_pipeline_date
  ON gate_decisions(pipeline_item_id, decided_at DESC);

-- user_annotations: unresolved annotations for review queue
CREATE INDEX IF NOT EXISTS idx_annotations_unresolved_type
  ON user_annotations(annotated_object_type, resolved)
  WHERE resolved = FALSE;

-- ---------------------------------------------------------------------------
-- Seed: Default gate rules for all three phase transitions
-- ---------------------------------------------------------------------------

-- Gate 0 → 1: Discovery to Ideation
-- Automatic if composite score >= 70, reject if < 40, human review between
INSERT INTO gate_rules (phase_from, phase_to, gate_type, high_threshold, low_threshold, config)
VALUES (
  'phase_0',
  'phase_1',
  'hybrid',
  70.0,
  40.0,
  jsonb_build_object(
    'auto_pass_above', 70.0,
    'auto_fail_below', 40.0,
    'require_human_review_between', true,
    'notification_channels', jsonb_build_array('dashboard'),
    'cooldown_hours', null,
    'description', 'Opportunity must score above 70 to auto-advance to Ideation. Below 40 is auto-rejected. Human review required for 40-70 range.'
  )
)
ON CONFLICT (phase_from, phase_to) DO UPDATE
  SET
    gate_type = EXCLUDED.gate_type,
    high_threshold = EXCLUDED.high_threshold,
    low_threshold = EXCLUDED.low_threshold,
    config = EXCLUDED.config,
    updated_at = NOW();

-- Gate 1 → 2: Ideation to Validation
-- Stricter threshold since validation is expensive
INSERT INTO gate_rules (phase_from, phase_to, gate_type, high_threshold, low_threshold, config)
VALUES (
  'phase_1',
  'phase_2',
  'hybrid',
  70.0,
  40.0,
  jsonb_build_object(
    'auto_pass_above', 70.0,
    'auto_fail_below', 40.0,
    'require_human_review_between', true,
    'notification_channels', jsonb_build_array('dashboard'),
    'cooldown_hours', null,
    'description', 'Concept must score above 70 to auto-advance to Validation. Below 40 is auto-rejected. Human review required for 40-70 range.'
  )
)
ON CONFLICT (phase_from, phase_to) DO UPDATE
  SET
    gate_type = EXCLUDED.gate_type,
    high_threshold = EXCLUDED.high_threshold,
    low_threshold = EXCLUDED.low_threshold,
    config = EXCLUDED.config,
    updated_at = NOW();

-- Gate 2 → 3: Validation to Blueprint
-- Verdict-based gate: 'go' advances, 'no_go' rejects, 'go_with_caution' requires human
INSERT INTO gate_rules (phase_from, phase_to, gate_type, high_threshold, low_threshold, config)
VALUES (
  'phase_2',
  'phase_3',
  'hybrid',
  70.0,
  40.0,
  jsonb_build_object(
    'auto_pass_above', 70.0,
    'auto_fail_below', 40.0,
    'require_human_review_between', true,
    'notification_channels', jsonb_build_array('dashboard'),
    'cooldown_hours', null,
    'description', 'Validated concept with go verdict and confidence >= 70 auto-advances to Blueprint. go_with_caution requires human review. no_go is auto-rejected.'
  )
)
ON CONFLICT (phase_from, phase_to) DO UPDATE
  SET
    gate_type = EXCLUDED.gate_type,
    high_threshold = EXCLUDED.high_threshold,
    low_threshold = EXCLUDED.low_threshold,
    config = EXCLUDED.config,
    updated_at = NOW();
