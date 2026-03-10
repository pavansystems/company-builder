export type AgentRunStatus = 'success' | 'partial' | 'failed' | 'timeout';

export type AgentTrigger = 'orchestrator' | 'webhook' | 'manual' | 'schedule';

export interface AgentRun {
  id: string;

  // Agent identity
  agent_name: string;
  agent_version: string | null;
  triggered_by: AgentTrigger | null;

  // Related pipeline item
  pipeline_item_id: string | null;

  // Execution details
  input_data: Record<string, unknown> | null;
  output_data: Record<string, unknown> | null;
  status: AgentRunStatus;
  error_message: string | null;

  // Resource usage
  execution_duration_seconds: number | null;
  tokens_input: number | null;
  tokens_output: number | null;
  cost_usd: number | null;

  // Timestamps
  started_at: string;
  completed_at: string | null;
}

export interface AgentRunInsert {
  id?: string;
  agent_name: string;
  agent_version?: string | null;
  triggered_by?: AgentTrigger | null;
  pipeline_item_id?: string | null;
  input_data?: Record<string, unknown> | null;
  output_data?: Record<string, unknown> | null;
  status: AgentRunStatus;
  error_message?: string | null;
  execution_duration_seconds?: number | null;
  tokens_input?: number | null;
  tokens_output?: number | null;
  cost_usd?: number | null;
  started_at?: string;
  completed_at?: string | null;
}

export interface AgentConfig {
  agent_name: string;
  agent_version: string;
  model: string;
  max_tokens: number;
  temperature: number;
  system_prompt: string;
  tools: string[];
  retry_on_failure: boolean;
  max_retries: number;
  timeout_seconds: number;
}

export interface AgentInput {
  pipeline_item_id: string | null;
  context: Record<string, unknown>;
  instructions: string;
}

export interface AgentOutput {
  success: boolean;
  data: Record<string, unknown>;
  tokens_used: number;
  cost_usd: number;
  duration_ms: number;
  error?: string;
}

export type AgentStatus = AgentRunStatus;

export type AgentName =
  | 'source-scanner'
  | 'signal-detector'
  | 'market-classifier'
  | 'opportunity-ranker'
  | 'watchlist-publisher'
  | 'landscape-analyst'
  | 'pain-extractor'
  | 'concept-generator'
  | 'concept-scorer'
  | 'concept-selector'
  | 'market-sizer'
  | 'competitive-analyst'
  | 'customer-validator'
  | 'feasibility-assessor'
  | 'economics-modeler'
  | 'validation-synthesizer'
  | 'business-designer'
  | 'agent-architect'
  | 'gtm-strategist'
  | 'risk-analyst'
  | 'resource-planner'
  | 'blueprint-packager'
  | 'pipeline-orchestrator';
