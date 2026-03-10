export type PipelineItemType = 'opportunity' | 'concept' | 'validation' | 'blueprint';

export type PipelinePhase =
  | 'phase_0'
  | 'phase_1'
  | 'phase_2'
  | 'phase_3'
  | 'rejected'
  | 'archived';

export type PipelineStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'blocked';

export type GateDecisionOutcome = 'pass' | 'fail' | 'override_pass' | 'override_fail';

export type PipelinePriority = 'low' | 'normal' | 'high';

export interface PipelineItem {
  id: string;

  // Item identity
  item_type: PipelineItemType | null;
  source_id: string | null;
  market_opportunity_id: string | null;
  concept_id: string | null;

  // Pipeline state
  current_phase: PipelinePhase | null;
  current_step: string | null;
  status: PipelineStatus | null;

  // Gate decisions
  last_gate_decision: string | null;
  last_gate_at: string | null;
  last_gate_reason: string | null;
  last_gate_by: string | null;

  // Timing
  entered_phase_at: string | null;
  entered_step_at: string | null;
  completed_at: string | null;

  // Tags and notes
  tags: string[] | null;
  priority: PipelinePriority | null;
}

export interface PipelineItemInsert {
  id?: string;
  item_type?: PipelineItemType | null;
  source_id?: string | null;
  market_opportunity_id?: string | null;
  concept_id?: string | null;
  current_phase?: PipelinePhase | null;
  current_step?: string | null;
  status?: PipelineStatus | null;
  last_gate_decision?: string | null;
  last_gate_at?: string | null;
  last_gate_reason?: string | null;
  last_gate_by?: string | null;
  entered_phase_at?: string | null;
  entered_step_at?: string | null;
  completed_at?: string | null;
  tags?: string[] | null;
  priority?: PipelinePriority | null;
}

export interface GateDecision {
  id: string;

  // Gate identity
  gate_phase: string | null;
  pipeline_item_id: string;

  // Decision
  decision: GateDecisionOutcome;
  decision_by: string | null;
  decision_reason: string | null;

  // Context
  pre_decision_data: Record<string, unknown> | null;
  override_reason: string | null;

  // Timestamps
  decided_at: string;
}

export interface GateDecisionInsert {
  id?: string;
  gate_phase?: string | null;
  pipeline_item_id: string;
  decision: GateDecisionOutcome;
  decision_by?: string | null;
  decision_reason?: string | null;
  pre_decision_data?: Record<string, unknown> | null;
  override_reason?: string | null;
  decided_at?: string;
}

export interface PipelineEvent {
  id: string;
  pipeline_item_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}
