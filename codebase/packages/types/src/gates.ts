export type GateType = 'automatic' | 'manual' | 'hybrid';

export type GateAction = 'pass' | 'fail' | 'review' | 'override_pass' | 'override_fail';

export interface GateRule {
  id: string;
  phase_from: string;
  phase_to: string;
  gate_type: GateType;
  high_threshold: number;
  low_threshold: number;
  config: GateRuleConfig | null;
  created_at: string;
  updated_at: string;
}

export interface GateRuleConfig {
  auto_pass_above: number;
  auto_fail_below: number;
  require_human_review_between: boolean;
  notification_channels: string[];
  cooldown_hours: number | null;
}

export interface GateRuleInsert {
  id?: string;
  phase_from: string;
  phase_to: string;
  gate_type: GateType;
  high_threshold: number;
  low_threshold: number;
  config?: GateRuleConfig | null;
  created_at?: string;
  updated_at?: string;
}

export interface GateEvaluation {
  pipeline_item_id: string;
  gate_rule: GateRule;
  composite_score: number;
  recommended_action: GateAction;
  reasoning: string;
  requires_human_review: boolean;
}
