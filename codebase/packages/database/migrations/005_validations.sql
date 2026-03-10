-- Migration 005: Validations
-- Phase 2 validation results table

CREATE TABLE IF NOT EXISTS validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  validation_phase VARCHAR(50),

  -- Market Sizing (Phase 2.1)
  tam_estimate BIGINT,
  tam_confidence NUMERIC(3,2),
  sam_estimate BIGINT,
  som_estimate BIGINT,
  growth_rate_percent NUMERIC(5,2),
  market_sizing_methodology TEXT,

  -- Competitive Analysis (Phase 2.2)
  competitors JSONB,
  vulnerability_map JSONB,
  competitive_intensity VARCHAR(50),

  -- Customer Validation (Phase 2.3)
  pain_point_evidence JSONB,
  early_adopter_profile TEXT,
  willingness_to_pay_low BIGINT,
  willingness_to_pay_high BIGINT,
  customer_validation_confidence NUMERIC(3,2),

  -- Feasibility Assessment (Phase 2.4)
  required_ai_capabilities JSONB,
  technical_risks JSONB,
  regulatory_barriers TEXT,
  showstoppers JSONB,
  feasibility_rating VARCHAR(50),

  -- Unit Economics (Phase 2.5)
  cac BIGINT,
  ltv BIGINT,
  ltv_cac_ratio NUMERIC(5,2),
  gross_margin_percent NUMERIC(5,2),
  breakeven_months INT,
  unit_economics_json JSONB,

  -- Synthesis & Verdict (Phase 2.6)
  verdict VARCHAR(50),
  confidence NUMERIC(3,2),
  summary TEXT,
  key_assumptions JSONB,
  risks JSONB,

  -- Metadata
  validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validated_by VARCHAR(255),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT validation_phase_valid CHECK (validation_phase IN ('market_sizing', 'competitive', 'customer', 'feasibility', 'economics', 'synthesis')),
  CONSTRAINT verdict_valid CHECK (verdict IN ('go', 'go_with_caution', 'no_go')),
  CONSTRAINT competitive_intensity_valid CHECK (competitive_intensity IN ('low', 'moderate', 'high')),
  CONSTRAINT feasibility_rating_valid CHECK (feasibility_rating IN ('viable', 'challenging', 'not_viable')),
  CONSTRAINT tam_confidence_range CHECK (tam_confidence IS NULL OR (tam_confidence >= 0.0 AND tam_confidence <= 1.0)),
  CONSTRAINT customer_confidence_range CHECK (customer_validation_confidence IS NULL OR (customer_validation_confidence >= 0.0 AND customer_validation_confidence <= 1.0)),
  CONSTRAINT verdict_confidence_range CHECK (confidence IS NULL OR (confidence >= 0.0 AND confidence <= 1.0))
);

CREATE TRIGGER validations_updated_at
  BEFORE UPDATE ON validations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_validations_concept ON validations(concept_id);
CREATE INDEX IF NOT EXISTS idx_validations_phase ON validations(validation_phase);
CREATE INDEX IF NOT EXISTS idx_validations_verdict ON validations(verdict);
CREATE INDEX IF NOT EXISTS idx_validations_validated_at ON validations(validated_at DESC);
