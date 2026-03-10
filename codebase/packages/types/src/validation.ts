export type ValidationPhase =
  | 'market_sizing'
  | 'competitive'
  | 'customer'
  | 'feasibility'
  | 'economics'
  | 'synthesis';

export type ValidationVerdict = 'go' | 'go_with_caution' | 'no_go';
export type FeasibilityRating = 'viable' | 'challenging' | 'not_viable';
export type CompetitiveIntensity = 'low' | 'moderate' | 'high';

export interface CompetitorProfile {
  name: string;
  pricing: string;
  weaknesses: string[];
  market_share: string | null;
}

export interface VulnerabilityMap {
  cost_advantages: string[];
  speed_advantages: string[];
  quality_advantages: string[];
}

export interface PainPointEvidence {
  pain_point: string;
  search_volume: number | null;
  sentiment: string | null;
  willingness_to_pay: number | null;
}

export interface TechnicalRisk {
  risk: string;
  severity: 'low' | 'medium' | 'high';
  known_solution: string | null;
}

export interface ValidationRisk {
  risk: string;
  severity: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface Validation {
  id: string;
  concept_id: string;
  validation_phase: ValidationPhase | null;

  // Market Sizing (Phase 2.1)
  tam_estimate: number | null;
  tam_confidence: number | null;
  sam_estimate: number | null;
  som_estimate: number | null;
  growth_rate_percent: number | null;
  market_sizing_methodology: string | null;

  // Competitive Analysis (Phase 2.2)
  competitors: CompetitorProfile[] | null;
  vulnerability_map: VulnerabilityMap | null;
  competitive_intensity: CompetitiveIntensity | null;

  // Customer Validation (Phase 2.3)
  pain_point_evidence: PainPointEvidence[] | null;
  early_adopter_profile: string | null;
  willingness_to_pay_low: number | null;
  willingness_to_pay_high: number | null;
  customer_validation_confidence: number | null;

  // Feasibility Assessment (Phase 2.4)
  required_ai_capabilities: string[] | null;
  technical_risks: TechnicalRisk[] | null;
  regulatory_barriers: string | null;
  showstoppers: string[] | null;
  feasibility_rating: FeasibilityRating | null;

  // Unit Economics (Phase 2.5)
  cac: number | null;
  ltv: number | null;
  ltv_cac_ratio: number | null;
  gross_margin_percent: number | null;
  breakeven_months: number | null;
  unit_economics_json: Record<string, unknown> | null;

  // Synthesis & Verdict (Phase 2.6)
  verdict: ValidationVerdict | null;
  confidence: number | null;
  summary: string | null;
  key_assumptions: string[] | null;
  risks: ValidationRisk[] | null;

  // Metadata
  validated_at: string;
  validated_by: string | null;
  updated_at: string;
}

export interface ValidationInsert {
  id?: string;
  concept_id: string;
  validation_phase?: ValidationPhase | null;
  tam_estimate?: number | null;
  tam_confidence?: number | null;
  sam_estimate?: number | null;
  som_estimate?: number | null;
  growth_rate_percent?: number | null;
  market_sizing_methodology?: string | null;
  competitors?: CompetitorProfile[] | null;
  vulnerability_map?: VulnerabilityMap | null;
  competitive_intensity?: CompetitiveIntensity | null;
  pain_point_evidence?: PainPointEvidence[] | null;
  early_adopter_profile?: string | null;
  willingness_to_pay_low?: number | null;
  willingness_to_pay_high?: number | null;
  customer_validation_confidence?: number | null;
  required_ai_capabilities?: string[] | null;
  technical_risks?: TechnicalRisk[] | null;
  regulatory_barriers?: string | null;
  showstoppers?: string[] | null;
  feasibility_rating?: FeasibilityRating | null;
  cac?: number | null;
  ltv?: number | null;
  ltv_cac_ratio?: number | null;
  gross_margin_percent?: number | null;
  breakeven_months?: number | null;
  unit_economics_json?: Record<string, unknown> | null;
  verdict?: ValidationVerdict | null;
  confidence?: number | null;
  summary?: string | null;
  key_assumptions?: string[] | null;
  risks?: ValidationRisk[] | null;
  validated_at?: string;
  validated_by?: string | null;
  updated_at?: string;
}
