export type RevenueModel = 'subscription' | 'usage_based' | 'marketplace' | 'hybrid';

export interface PricingTier {
  name: string;
  price: number;
  features: string[];
  target_segment: string;
}

export interface AgentRole {
  role: string;
  agent_or_human: 'agent' | 'human' | 'hybrid';
  responsibilities: string[];
  tools: string[];
  decision_boundaries: string;
  cost_usd_per_month: number | null;
}

export interface HumanRole {
  role: string;
  responsibilities: string[];
  headcount: number;
  cost_usd_per_year: number;
}

export interface EscalationProtocol {
  trigger: string;
  escalation_path: string;
  sla_minutes: number | null;
}

export interface OperationalCostBreakdown {
  agent_compute: number;
  human: number;
  tools: number;
  total: number;
}

export interface GtmChannel {
  channel: string;
  agent_handled: boolean;
  tactics: string[];
}

export interface GtmLaunchTimeline {
  day_1_30: string[];
  day_31_60: string[];
  day_61_90: string[];
}

export interface RiskItem {
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'low' | 'medium' | 'high';
  mitigation: string;
  monitoring_trigger: string;
}

export interface HiringPlanEntry {
  role: string;
  headcount: number;
  start_month: number;
  cost_per_person: number;
}

export interface FundingMilestone {
  milestone: string;
  required_funding_usd: number;
  month: number;
}

export interface FinancialProjectionMonth {
  month: number;
  revenue: number;
  costs: number;
  margin: number;
}

export interface Blueprint {
  id: string;
  concept_id: string;

  // Business Model (Phase 3.1)
  revenue_model: RevenueModel | null;
  pricing_tiers: PricingTier[] | null;
  customer_journey: string | null;
  expansion_revenue_opportunities: Record<string, unknown> | null;
  financial_projection_months: number | null;
  financial_projection: FinancialProjectionMonth[] | null;

  // Agent Architecture (Phase 3.2)
  agent_roles: AgentRole[] | null;
  human_roles: HumanRole[] | null;
  escalation_protocols: EscalationProtocol[] | null;
  operational_cost_breakdown: OperationalCostBreakdown | null;

  // Go-to-Market (Phase 3.3)
  gtm_target_segment: string | null;
  gtm_channels: GtmChannel[] | null;
  gtm_messaging_framework: string | null;
  gtm_launch_timeline: GtmLaunchTimeline | null;
  agent_gtm_activities: string[] | null;
  human_gtm_activities: string[] | null;

  // Risk Register (Phase 3.4)
  risks: RiskItem[] | null;

  // Resource & Runway (Phase 3.5)
  upfront_build_cost: number | null;
  monthly_operating_cost: number | null;
  hiring_plan: HiringPlanEntry[] | null;
  technology_stack: Record<string, unknown> | null;
  funding_milestones: FundingMilestone[] | null;
  runway_months: number | null;

  // Packaging (Phase 3.6)
  executive_summary: string | null;
  internal_consistency_notes: string | null;

  // Metadata
  created_at: string;
  created_by: string | null;
  updated_at: string;
  is_finalized: boolean;
  finalized_at: string | null;
  storage_location_pdf: string | null;
  account_id: string;
}

export interface BlueprintInsert {
  id?: string;
  concept_id: string;
  revenue_model?: RevenueModel | null;
  pricing_tiers?: PricingTier[] | null;
  customer_journey?: string | null;
  expansion_revenue_opportunities?: Record<string, unknown> | null;
  financial_projection_months?: number | null;
  financial_projection?: FinancialProjectionMonth[] | null;
  agent_roles?: AgentRole[] | null;
  human_roles?: HumanRole[] | null;
  escalation_protocols?: EscalationProtocol[] | null;
  operational_cost_breakdown?: OperationalCostBreakdown | null;
  gtm_target_segment?: string | null;
  gtm_channels?: GtmChannel[] | null;
  gtm_messaging_framework?: string | null;
  gtm_launch_timeline?: GtmLaunchTimeline | null;
  agent_gtm_activities?: string[] | null;
  human_gtm_activities?: string[] | null;
  risks?: RiskItem[] | null;
  upfront_build_cost?: number | null;
  monthly_operating_cost?: number | null;
  hiring_plan?: HiringPlanEntry[] | null;
  technology_stack?: Record<string, unknown> | null;
  funding_milestones?: FundingMilestone[] | null;
  runway_months?: number | null;
  executive_summary?: string | null;
  internal_consistency_notes?: string | null;
  created_at?: string;
  created_by?: string | null;
  updated_at?: string;
  is_finalized?: boolean;
  finalized_at?: string | null;
  storage_location_pdf?: string | null;
  account_id?: string;
}

export type BlueprintStatus = 'draft' | 'in_progress' | 'complete' | 'finalized';
