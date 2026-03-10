-- Migration 002: Signals and Market Opportunities
-- Phase 0 signal detection and market classification tables

CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  signal_type VARCHAR(50) NOT NULL,
  summary TEXT NOT NULL,
  confidence NUMERIC(3,2),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detected_by VARCHAR(255),
  entities JSONB,
  impact_rating VARCHAR(20),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT signal_type_valid CHECK (signal_type IN ('tech_breakthrough', 'regulatory_shift', 'market_event', 'customer_pain')),
  CONSTRAINT confidence_range CHECK (confidence >= 0.0 AND confidence <= 1.0),
  CONSTRAINT impact_rating_valid CHECK (impact_rating IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_signals_content_item ON signals(content_item_id);
CREATE INDEX IF NOT EXISTS idx_signals_type ON signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_signals_detected ON signals(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_confidence ON signals(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_signals_archived ON signals(is_archived) WHERE is_archived = FALSE;

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS market_opportunities (
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ranked_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  archived_at TIMESTAMPTZ,

  CONSTRAINT agent_readiness_valid CHECK (agent_readiness_tag IN ('high', 'medium', 'low')),
  CONSTRAINT competitive_density_valid CHECK (competitive_density IN ('crowded', 'moderate', 'sparse')),
  CONSTRAINT market_size_confidence_range CHECK (market_size_confidence >= 0.0 AND market_size_confidence <= 1.0)
);

CREATE INDEX IF NOT EXISTS idx_market_opp_active ON market_opportunities(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_market_opp_ranked ON market_opportunities(ranked_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_opp_industry ON market_opportunities(target_industry);
CREATE INDEX IF NOT EXISTS idx_market_opp_created ON market_opportunities(created_at DESC);

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS opportunity_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_opportunity_id UUID NOT NULL REFERENCES market_opportunities(id) ON DELETE CASCADE,
  scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scored_by VARCHAR(255),

  -- Dimension scores (0.0–1.0)
  market_size_score NUMERIC(3,2),
  signal_convergence_score NUMERIC(3,2),
  agent_readiness_score NUMERIC(3,2),
  competitive_density_score NUMERIC(3,2),
  timing_confidence_score NUMERIC(3,2),

  -- Composite
  composite_score NUMERIC(3,2),

  -- Weights (should sum to 1.0)
  weight_market_size NUMERIC(3,2) NOT NULL DEFAULT 0.25,
  weight_signal_convergence NUMERIC(3,2) NOT NULL DEFAULT 0.25,
  weight_agent_readiness NUMERIC(3,2) NOT NULL DEFAULT 0.20,
  weight_competitive_density NUMERIC(3,2) NOT NULL DEFAULT 0.15,
  weight_timing_confidence NUMERIC(3,2) NOT NULL DEFAULT 0.15,

  reasoning TEXT,

  CONSTRAINT score_market_size_range CHECK (market_size_score IS NULL OR (market_size_score >= 0.0 AND market_size_score <= 1.0)),
  CONSTRAINT score_signal_range CHECK (signal_convergence_score IS NULL OR (signal_convergence_score >= 0.0 AND signal_convergence_score <= 1.0)),
  CONSTRAINT score_agent_range CHECK (agent_readiness_score IS NULL OR (agent_readiness_score >= 0.0 AND agent_readiness_score <= 1.0)),
  CONSTRAINT score_competitive_range CHECK (competitive_density_score IS NULL OR (competitive_density_score >= 0.0 AND competitive_density_score <= 1.0)),
  CONSTRAINT score_timing_range CHECK (timing_confidence_score IS NULL OR (timing_confidence_score >= 0.0 AND timing_confidence_score <= 1.0)),
  CONSTRAINT score_composite_range CHECK (composite_score IS NULL OR (composite_score >= 0.0 AND composite_score <= 1.0))
);

CREATE INDEX IF NOT EXISTS idx_opp_scores_composite ON opportunity_scores(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_opp_scores_market_opp ON opportunity_scores(market_opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opp_scores_scored_at ON opportunity_scores(scored_at DESC);
