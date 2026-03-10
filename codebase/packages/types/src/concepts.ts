export type ConceptSourcePhase = 'generated' | 'user_provided';

export interface Concept {
  id: string;
  market_opportunity_id: string;
  title: string;
  summary: string | null;
  value_proposition: string | null;
  target_customer_segment: string | null;
  pain_points_addressed: string[] | null;
  agent_architecture_sketch: string | null;
  defensibility_notes: string | null;
  generated_at: string;
  generated_by: string | null;
  source_phase: ConceptSourcePhase | null;
  is_active: boolean;
  selected_for_validation: boolean;
  archived_at: string | null;
}

export interface ConceptInsert {
  id?: string;
  market_opportunity_id: string;
  title: string;
  summary?: string | null;
  value_proposition?: string | null;
  target_customer_segment?: string | null;
  pain_points_addressed?: string[] | null;
  agent_architecture_sketch?: string | null;
  defensibility_notes?: string | null;
  generated_at?: string;
  generated_by?: string | null;
  source_phase?: ConceptSourcePhase | null;
  is_active?: boolean;
  selected_for_validation?: boolean;
  archived_at?: string | null;
}

export interface ConceptScore {
  id: string;
  concept_id: string;
  scored_at: string;
  scored_by: string | null;
  disruption_potential: number | null;
  agent_readiness: number | null;
  feasibility: number | null;
  differentiation: number | null;
  revenue_clarity: number | null;
  composite_score: number | null;
  weight_disruption: number;
  weight_agent_readiness: number;
  weight_feasibility: number;
  weight_differentiation: number;
  weight_revenue_clarity: number;
  reasoning: string | null;
}

export interface ConceptScoreInsert {
  id?: string;
  concept_id: string;
  scored_at?: string;
  scored_by?: string | null;
  disruption_potential?: number | null;
  agent_readiness?: number | null;
  feasibility?: number | null;
  differentiation?: number | null;
  revenue_clarity?: number | null;
  composite_score?: number | null;
  weight_disruption?: number;
  weight_agent_readiness?: number;
  weight_feasibility?: number;
  weight_differentiation?: number;
  weight_revenue_clarity?: number;
  reasoning?: string | null;
}

export type ConceptStatus = 'active' | 'selected' | 'archived' | 'rejected';
