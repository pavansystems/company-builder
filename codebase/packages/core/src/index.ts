// ---------------------------------------------------------------------------
// @company-builder/core
// Re-exports everything from all modules in this package.
// ---------------------------------------------------------------------------

// Agents
export { Agent } from './agents/Agent';
export type { AgentConstructorConfig } from './agents/Agent';
export {
  AgentError,
  AgentInputError,
  AgentLLMError,
  AgentOutputValidationError,
  AgentPersistenceError,
  AgentTimeoutError,
} from './agents/AgentError';
export { withRetry } from './agents/retryPolicy';
export { estimateCost } from './agents/costTracker';

// Pipeline
export {
  VALID_TRANSITIONS,
  isValidTransition,
  getNextState,
} from './pipeline/StateMachine';
export type { PipelineState } from './pipeline/StateMachine';
export { GateEvaluator } from './pipeline/GateEvaluator';
export type { GateOutcome, GateEvaluationResult } from './pipeline/GateEvaluator';
export { PrerequisiteChecker } from './pipeline/PrerequisiteChecker';
export type { PrerequisiteResult } from './pipeline/PrerequisiteChecker';
export { TaskDispatcher } from './pipeline/TaskDispatcher';
export { WatchdogTimer } from './pipeline/WatchdogTimer';

// Storage
export { PipelineStore } from './storage/PipelineStore';
export { AgentRunStore } from './storage/AgentRunStore';

// Utils — logger
export { logger } from './utils/logger';
export type { LogLevel, LogEntry, Logger } from './utils/logger';

// Utils — scoring
export {
  computeWeightedScore,
  normalizeScore,
  getScoreBand,
} from './utils/scoring';
export type { ScoreBand } from './utils/scoring';

// Utils — schemas
export { AgentInputSchema, AgentOutputSchema } from './utils/schemas';
export type { AgentInputSchemaType, AgentOutputSchemaType } from './utils/schemas';

// Utils — formatters
export {
  formatCurrency,
  formatMarketSize,
  formatScore,
  formatDuration,
  formatDate,
  formatRelativeTime,
} from './utils/formatters';
