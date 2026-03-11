// ---------------------------------------------------------------------------
// @company-builder/database
// Re-exports everything consumers need from the database package.
// ---------------------------------------------------------------------------

// Supabase client factories
export {
  createServerSupabaseClient,
  createBrowserSupabaseClient,
} from './client';

// Database type definitions
export type {
  Database,
  Tables,
  InsertDTO,
  UpdateDTO,
} from './types';

// Query helpers — opportunities
export {
  getOpportunities,
  getOpportunityById,
  getOpportunityScores,
  getLatestWatchlist,
  getWatchlistVersions,
} from './queries/opportunities';
export type { OpportunityWithScore } from './queries/opportunities';

// Query helpers — concepts
export {
  getConcepts,
  getConceptById,
  getConceptScores,
  getConceptsWithScores,
} from './queries/concepts';
export type { ConceptWithScore } from './queries/concepts';

// Query helpers — validations
export {
  getValidations,
  getValidationsByConceptId,
  getValidationById,
  getValidationSynthesis,
} from './queries/validations';

// Query helpers — blueprints
export {
  getBlueprints,
  getBlueprintById,
  getBlueprintByConceptId,
  getFinalizedBlueprints,
} from './queries/blueprints';

// Query helpers — pipeline
export {
  getPipelineItems,
  getPipelineItemById,
  getActivePipelineItems,
  getInFlightCountsByPhase,
  getGateDecisionsForItem,
  getAgentRunsForItem,
  getGateRules,
  getGateRuleForTransition,
  updateGateRule,
} from './queries/pipeline';

// Query helpers — sources
export {
  getSources,
  getSourceById,
  createSource,
  updateSource,
  deleteSource,
} from './queries/sources';

// Query helpers — agent runs (monitoring)
export {
  getAgentRuns,
  getAgentRunStats,
  getAgentRunById,
  getCostBreakdown,
  getDistinctAgentNames,
} from './queries/agent-runs';
export type {
  AgentRunStats,
  CostBreakdownItem,
} from './queries/agent-runs';
