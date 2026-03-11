import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '../types';

type PipelineItem = Tables<'pipeline_items'>;
type GateDecision = Tables<'gate_decisions'>;
type AgentRun = Tables<'agent_runs'>;
type GateRule = Tables<'gate_rules'>;

// ---------------------------------------------------------------------------
// getPipelineItems
// Returns pipeline items with optional filters.
// ---------------------------------------------------------------------------

export async function getPipelineItems(
  client: SupabaseClient<Database>,
  options: {
    phase?: PipelineItem['current_phase'];
    status?: PipelineItem['status'];
    itemType?: PipelineItem['item_type'];
    conceptId?: string;
    marketOpportunityId?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data: PipelineItem[]; count: number | null; error: Error | null }> {
  const {
    phase,
    status,
    itemType,
    conceptId,
    marketOpportunityId,
    limit = 50,
    offset = 0,
  } = options;

  let query = client
    .from('pipeline_items')
    .select('*', { count: 'exact' })
    .order('entered_phase_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (phase !== undefined && phase !== null) {
    query = query.eq('current_phase', phase);
  }

  if (status !== undefined && status !== null) {
    query = query.eq('status', status);
  }

  if (itemType !== undefined && itemType !== null) {
    query = query.eq('item_type', itemType);
  }

  if (conceptId !== undefined) {
    query = query.eq('concept_id', conceptId);
  }

  if (marketOpportunityId !== undefined) {
    query = query.eq('market_opportunity_id', marketOpportunityId);
  }

  const { data, count, error } = await query;

  if (error !== null) {
    return { data: [], count: null, error: new Error(error.message) };
  }

  return { data: data ?? [], count, error: null };
}

// ---------------------------------------------------------------------------
// getPipelineItemById
// Returns a single pipeline item by ID.
// ---------------------------------------------------------------------------

export async function getPipelineItemById(
  client: SupabaseClient<Database>,
  id: string
): Promise<{ data: PipelineItem | null; error: Error | null }> {
  const { data, error } = await client
    .from('pipeline_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error !== null) {
    if (error.code === 'PGRST116') {
      return { data: null, error: null };
    }
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

// ---------------------------------------------------------------------------
// getActivePipelineItems
// Returns all items currently in-flight (not rejected, not archived, not completed).
// ---------------------------------------------------------------------------

export async function getActivePipelineItems(
  client: SupabaseClient<Database>,
  options: { limit?: number } = {}
): Promise<{ data: PipelineItem[]; error: Error | null }> {
  const { limit = 100 } = options;

  const { data, error } = await client
    .from('pipeline_items')
    .select('*')
    .in('status', ['pending', 'in_progress', 'blocked'])
    .not('current_phase', 'in', '("rejected","archived")')
    .order('entered_phase_at', { ascending: false })
    .limit(limit);

  if (error !== null) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data ?? [], error: null };
}

// ---------------------------------------------------------------------------
// getGateDecisionsForItem
// Returns all gate decisions for a pipeline item, newest first.
// ---------------------------------------------------------------------------

export async function getGateDecisionsForItem(
  client: SupabaseClient<Database>,
  pipelineItemId: string
): Promise<{ data: GateDecision[]; error: Error | null }> {
  const { data, error } = await client
    .from('gate_decisions')
    .select('*')
    .eq('pipeline_item_id', pipelineItemId)
    .order('decided_at', { ascending: false });

  if (error !== null) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data ?? [], error: null };
}

// ---------------------------------------------------------------------------
// getAgentRunsForItem
// Returns all agent runs for a pipeline item, newest first.
// ---------------------------------------------------------------------------

export async function getAgentRunsForItem(
  client: SupabaseClient<Database>,
  pipelineItemId: string,
  options: { limit?: number } = {}
): Promise<{ data: AgentRun[]; error: Error | null }> {
  const { limit = 50 } = options;

  const { data, error } = await client
    .from('agent_runs')
    .select('*')
    .eq('pipeline_item_id', pipelineItemId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error !== null) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data ?? [], error: null };
}

// ---------------------------------------------------------------------------
// getGateRules
// Returns all configured gate rules.
// ---------------------------------------------------------------------------

export async function getGateRules(
  client: SupabaseClient<Database>
): Promise<{ data: GateRule[]; error: Error | null }> {
  const { data, error } = await client
    .from('gate_rules')
    .select('*')
    .order('phase_from', { ascending: true });

  if (error !== null) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data ?? [], error: null };
}

// ---------------------------------------------------------------------------
// getGateRuleForTransition
// Returns the gate rule for a specific phase transition.
// ---------------------------------------------------------------------------

export async function getGateRuleForTransition(
  client: SupabaseClient<Database>,
  phaseFrom: string,
  phaseTo: string
): Promise<{ data: GateRule | null; error: Error | null }> {
  const { data, error } = await client
    .from('gate_rules')
    .select('*')
    .eq('phase_from', phaseFrom)
    .eq('phase_to', phaseTo)
    .single();

  if (error !== null) {
    if (error.code === 'PGRST116') {
      return { data: null, error: null };
    }
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

// ---------------------------------------------------------------------------
// getReviewQueueItems
// Returns items with status 'blocked' or last_gate_decision 'review',
// ordered by entered_phase_at (oldest first for queue priority).
// ---------------------------------------------------------------------------

export async function getReviewQueueItems(
  client: SupabaseClient<Database>,
  options: {
    phase?: PipelineItem['current_phase'];
    limit?: number;
  } = {}
): Promise<{ data: PipelineItem[]; count: number | null; error: Error | null }> {
  const { phase, limit = 100 } = options;

  let query = client
    .from('pipeline_items')
    .select('*', { count: 'exact' })
    .or('status.eq.blocked,last_gate_decision.eq.review')
    .order('entered_phase_at', { ascending: true })
    .limit(limit);

  if (phase !== undefined && phase !== null) {
    query = query.eq('current_phase', phase);
  }

  const { data, count, error } = await query;

  if (error !== null) {
    return { data: [], count: null, error: new Error(error.message) };
  }

  return { data: data ?? [], count, error: null };
}

// ---------------------------------------------------------------------------
// getReviewItemDetail
// Returns a single pipeline item with its related agent runs and gate decisions.
// ---------------------------------------------------------------------------

export async function getReviewItemDetail(
  client: SupabaseClient<Database>,
  itemId: string
): Promise<{
  data: {
    item: PipelineItem | null;
    agentRuns: AgentRun[];
    gateDecisions: GateDecision[];
  };
  error: Error | null;
}> {
  // Fetch item
  const { data: item, error: itemError } = await client
    .from('pipeline_items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (itemError !== null) {
    if (itemError.code === 'PGRST116') {
      return { data: { item: null, agentRuns: [], gateDecisions: [] }, error: null };
    }
    return {
      data: { item: null, agentRuns: [], gateDecisions: [] },
      error: new Error(itemError.message),
    };
  }

  // Fetch related agent runs
  const { data: agentRuns, error: runsError } = await client
    .from('agent_runs')
    .select('*')
    .eq('pipeline_item_id', itemId)
    .order('started_at', { ascending: false });

  if (runsError !== null) {
    return {
      data: { item, agentRuns: [], gateDecisions: [] },
      error: new Error(runsError.message),
    };
  }

  // Fetch gate decisions
  const { data: gateDecisions, error: gateError } = await client
    .from('gate_decisions')
    .select('*')
    .eq('pipeline_item_id', itemId)
    .order('decided_at', { ascending: false });

  if (gateError !== null) {
    return {
      data: { item, agentRuns: agentRuns ?? [], gateDecisions: [] },
      error: new Error(gateError.message),
    };
  }

  return {
    data: { item, agentRuns: agentRuns ?? [], gateDecisions: gateDecisions ?? [] },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// getInFlightCountsByPhase
// Returns the count of in_progress pipeline items grouped by current_phase.
// ---------------------------------------------------------------------------

export async function getInFlightCountsByPhase(
  client: SupabaseClient<Database>
): Promise<{ data: Record<string, number>; error: Error | null }> {
  const { data, error } = await client
    .from('pipeline_items')
    .select('current_phase')
    .eq('status', 'in_progress');

  if (error !== null) {
    return { data: {}, error: new Error(error.message) };
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const phase = row.current_phase;
    if (phase !== null) {
      counts[phase] = (counts[phase] ?? 0) + 1;
    }
  }

  return { data: counts, error: null };
}

// ---------------------------------------------------------------------------
// updateGateRule
// Updates an existing gate rule (thresholds, gate type, etc.).
// ---------------------------------------------------------------------------

export async function updateGateRule(
  client: SupabaseClient<Database>,
  id: string,
  updates: Partial<Pick<GateRule, 'gate_type' | 'high_threshold' | 'low_threshold' | 'config'>>
): Promise<{ data: GateRule | null; error: Error | null }> {
  const { data, error } = await client
    .from('gate_rules')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error !== null) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}
