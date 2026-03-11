export type SignalType = 'tech_breakthrough' | 'regulatory_shift' | 'market_event' | 'customer_pain';
export type ImpactRating = 'low' | 'medium' | 'high' | 'critical';
export type AgentReadinessTag = 'high' | 'medium' | 'low';
export type CompetitiveDensity = 'crowded' | 'moderate' | 'sparse';

export interface SignalEntities {
  companies: string[];
  technologies: string[];
  trends: string[];
}

export interface Signal {
  id: string;
  content_item_id: string;
  signal_type: SignalType;
  summary: string;
  confidence: number | null;
  detected_at: string;
  detected_by: string | null;
  entities: SignalEntities | null;
  impact_rating: ImpactRating | null;
  is_archived: boolean;
  account_id: string;
}

export interface SignalInsert {
  id?: string;
  content_item_id: string;
  signal_type: SignalType;
  summary: string;
  confidence?: number | null;
  detected_at?: string;
  detected_by?: string | null;
  entities?: SignalEntities | null;
  impact_rating?: ImpactRating | null;
  is_archived?: boolean;
  account_id?: string;
}

export interface MarketOpportunity {
  id: string;
  title: string;
  description: string | null;
  target_market: string | null;
  target_industry: string | null;
  problem_statement: string | null;
  enabling_signals: string[] | null;
  agent_readiness_tag: AgentReadinessTag | null;
  market_size_estimate: number | null;
  market_size_confidence: number | null;
  competitive_density: CompetitiveDensity | null;
  created_at: string;
  ranked_at: string | null;
  is_active: boolean;
  archived_at: string | null;
  account_id: string;
}

export interface MarketOpportunityInsert {
  id?: string;
  title: string;
  description?: string | null;
  target_market?: string | null;
  target_industry?: string | null;
  problem_statement?: string | null;
  enabling_signals?: string[] | null;
  agent_readiness_tag?: AgentReadinessTag | null;
  market_size_estimate?: number | null;
  market_size_confidence?: number | null;
  competitive_density?: CompetitiveDensity | null;
  created_at?: string;
  ranked_at?: string | null;
  is_active?: boolean;
  archived_at?: string | null;
  account_id?: string;
}

export interface OpportunityScore {
  id: string;
  market_opportunity_id: string;
  scored_at: string;
  scored_by: string | null;
  market_size_score: number | null;
  signal_convergence_score: number | null;
  agent_readiness_score: number | null;
  competitive_density_score: number | null;
  timing_confidence_score: number | null;
  composite_score: number | null;
  weight_market_size: number;
  weight_signal_convergence: number;
  weight_agent_readiness: number;
  weight_competitive_density: number;
  weight_timing_confidence: number;
  reasoning: string | null;
  account_id: string;
}

export interface OpportunityScoreInsert {
  id?: string;
  market_opportunity_id: string;
  scored_at?: string;
  scored_by?: string | null;
  market_size_score?: number | null;
  signal_convergence_score?: number | null;
  agent_readiness_score?: number | null;
  competitive_density_score?: number | null;
  timing_confidence_score?: number | null;
  composite_score?: number | null;
  weight_market_size?: number;
  weight_signal_convergence?: number;
  weight_agent_readiness?: number;
  weight_competitive_density?: number;
  weight_timing_confidence?: number;
  reasoning?: string | null;
  account_id?: string;
}

export interface WatchlistVersionSnapshotItem {
  id: string;
  title: string;
  score: number;
  rank: number;
  target_market: string | null;
  target_industry: string | null;
}

export interface WatchlistVersion {
  id: string;
  version_number: number;
  published_at: string;
  snapshot_data: WatchlistVersionSnapshotItem[] | null;
  total_opportunities: number | null;
  created_by: string | null;
  account_id: string;
}

export interface WatchlistVersionInsert {
  id?: string;
  version_number: number;
  published_at?: string;
  snapshot_data?: WatchlistVersionSnapshotItem[] | null;
  total_opportunities?: number | null;
  created_by?: string | null;
  account_id?: string;
}

export interface SignalCluster {
  signals: Signal[];
  market_category: string;
  cluster_confidence: number;
  summary: string;
}

export interface WatchlistItem {
  opportunity: MarketOpportunity;
  score: OpportunityScore | null;
  rank: number;
}
