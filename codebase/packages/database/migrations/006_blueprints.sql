-- Migration 006: Blueprints
-- Phase 3 blueprint documents table

CREATE TABLE IF NOT EXISTS blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(id),

  -- Business Model (Phase 3.1)
  revenue_model VARCHAR(255),
  pricing_tiers JSONB,
  customer_journey TEXT,
  expansion_revenue_opportunities JSONB,
  financial_projection_months INT,
  financial_projection JSONB,

  -- Agent Architecture (Phase 3.2)
  agent_roles JSONB,
  human_roles JSONB,
  escalation_protocols JSONB,
  operational_cost_breakdown JSONB,

  -- Go-to-Market (Phase 3.3)
  gtm_target_segment TEXT,
  gtm_channels JSONB,
  gtm_messaging_framework TEXT,
  gtm_launch_timeline JSONB,
  agent_gtm_activities JSONB,
  human_gtm_activities JSONB,

  -- Risk Register (Phase 3.4)
  risks JSONB,

  -- Resource & Runway (Phase 3.5)
  upfront_build_cost BIGINT,
  monthly_operating_cost BIGINT,
  hiring_plan JSONB,
  technology_stack JSONB,
  funding_milestones JSONB,
  runway_months INT,

  -- Packaging (Phase 3.6)
  executive_summary TEXT,
  internal_consistency_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_finalized BOOLEAN NOT NULL DEFAULT FALSE,
  finalized_at TIMESTAMPTZ,
  storage_location_pdf TEXT,

  CONSTRAINT revenue_model_valid CHECK (revenue_model IN ('subscription', 'usage_based', 'marketplace', 'hybrid'))
);

CREATE TRIGGER blueprints_updated_at
  BEFORE UPDATE ON blueprints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_blueprints_concept ON blueprints(concept_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_finalized ON blueprints(is_finalized);
CREATE INDEX IF NOT EXISTS idx_blueprints_created ON blueprints(created_at DESC);
