-- Migration 004: Concepts and Concept Scores
-- Phase 1 ideation tables

CREATE TABLE IF NOT EXISTS concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_opportunity_id UUID NOT NULL REFERENCES market_opportunities(id),
  title VARCHAR(512) NOT NULL,
  summary TEXT,

  -- Core concept definition
  value_proposition TEXT,
  target_customer_segment TEXT,
  pain_points_addressed JSONB,
  agent_architecture_sketch TEXT,
  defensibility_notes TEXT,

  -- Metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by VARCHAR(255),
  source_phase VARCHAR(50),

  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  selected_for_validation BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,

  CONSTRAINT source_phase_valid CHECK (source_phase IN ('generated', 'user_provided'))
);

CREATE INDEX IF NOT EXISTS idx_concepts_market_opp ON concepts(market_opportunity_id);
CREATE INDEX IF NOT EXISTS idx_concepts_active ON concepts(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_concepts_selected ON concepts(selected_for_validation) WHERE selected_for_validation = TRUE;
CREATE INDEX IF NOT EXISTS idx_concepts_generated ON concepts(generated_at DESC);

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS concept_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scored_by VARCHAR(255),

  -- Dimension scores (0.0–1.0)
  disruption_potential NUMERIC(3,2),
  agent_readiness NUMERIC(3,2),
  feasibility NUMERIC(3,2),
  differentiation NUMERIC(3,2),
  revenue_clarity NUMERIC(3,2),

  -- Composite
  composite_score NUMERIC(3,2),

  -- Weights (should sum to 1.0)
  weight_disruption NUMERIC(3,2) NOT NULL DEFAULT 0.25,
  weight_agent_readiness NUMERIC(3,2) NOT NULL DEFAULT 0.25,
  weight_feasibility NUMERIC(3,2) NOT NULL DEFAULT 0.20,
  weight_differentiation NUMERIC(3,2) NOT NULL DEFAULT 0.15,
  weight_revenue_clarity NUMERIC(3,2) NOT NULL DEFAULT 0.15,

  reasoning TEXT,

  CONSTRAINT score_disruption_range CHECK (disruption_potential IS NULL OR (disruption_potential >= 0.0 AND disruption_potential <= 1.0)),
  CONSTRAINT score_agent_readiness_range CHECK (agent_readiness IS NULL OR (agent_readiness >= 0.0 AND agent_readiness <= 1.0)),
  CONSTRAINT score_feasibility_range CHECK (feasibility IS NULL OR (feasibility >= 0.0 AND feasibility <= 1.0)),
  CONSTRAINT score_differentiation_range CHECK (differentiation IS NULL OR (differentiation >= 0.0 AND differentiation <= 1.0)),
  CONSTRAINT score_revenue_clarity_range CHECK (revenue_clarity IS NULL OR (revenue_clarity >= 0.0 AND revenue_clarity <= 1.0)),
  CONSTRAINT score_composite_range CHECK (composite_score IS NULL OR (composite_score >= 0.0 AND composite_score <= 1.0))
);

CREATE INDEX IF NOT EXISTS idx_concept_scores_composite ON concept_scores(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_concept_scores_concept ON concept_scores(concept_id);
CREATE INDEX IF NOT EXISTS idx_concept_scores_scored_at ON concept_scores(scored_at DESC);
