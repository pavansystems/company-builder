import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '../types';

type AgentRun = Tables<'agent_runs'>;

// ---------------------------------------------------------------------------
// getAgentRuns
// Returns agent runs with optional filters and pagination.
// ---------------------------------------------------------------------------

export async function getAgentRuns(
  client: SupabaseClient<Database>,
  options: {
    status?: AgentRun['status'];
    agentName?: string;
    phase?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<{ data: AgentRun[]; count: number | null; error: Error | null }> {
  const {
    status,
    agentName,
    limit = 20,
    offset = 0,
    sortBy = 'started_at',
    sortOrder = 'desc',
  } = options;

  let query = client
    .from('agent_runs')
    .select('*', { count: 'exact' })
    .order(sortBy as keyof AgentRun, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1);

  if (status !== undefined && status !== null) {
    query = query.eq('status', status);
  }

  if (agentName !== undefined && agentName !== null) {
    query = query.eq('agent_name', agentName);
  }

  const { data, count, error } = await query;

  if (error !== null) {
    return { data: [], count: null, error: new Error(error.message) };
  }

  return { data: data ?? [], count, error: null };
}

// ---------------------------------------------------------------------------
// getAgentRunStats
// Returns aggregated statistics for a given period.
// ---------------------------------------------------------------------------

export interface AgentRunStats {
  totalRuns: number;
  successCount: number;
  failedCount: number;
  partialCount: number;
  timeoutCount: number;
  successRate: number;
  avgDurationSeconds: number;
  totalCostUsd: number;
  totalTokensInput: number;
  totalTokensOutput: number;
}

export async function getAgentRunStats(
  client: SupabaseClient<Database>,
  periodDays: number = 7
): Promise<{ data: AgentRunStats; error: Error | null }> {
  const since = new Date();
  since.setDate(since.getDate() - periodDays);
  const sinceIso = since.toISOString();

  const { data, error } = await client
    .from('agent_runs')
    .select('status, execution_duration_seconds, cost_usd, tokens_input, tokens_output')
    .gte('started_at', sinceIso);

  if (error !== null) {
    return {
      data: {
        totalRuns: 0,
        successCount: 0,
        failedCount: 0,
        partialCount: 0,
        timeoutCount: 0,
        successRate: 0,
        avgDurationSeconds: 0,
        totalCostUsd: 0,
        totalTokensInput: 0,
        totalTokensOutput: 0,
      },
      error: new Error(error.message),
    };
  }

  const runs = data ?? [];
  const totalRuns = runs.length;
  const successCount = runs.filter((r) => r.status === 'success').length;
  const failedCount = runs.filter((r) => r.status === 'failed').length;
  const partialCount = runs.filter((r) => r.status === 'partial').length;
  const timeoutCount = runs.filter((r) => r.status === 'timeout').length;
  const successRate = totalRuns > 0 ? Math.round((successCount / totalRuns) * 100) : 0;

  const totalDuration = runs.reduce(
    (sum, r) => sum + (r.execution_duration_seconds ?? 0),
    0
  );
  const avgDurationSeconds = totalRuns > 0 ? Math.round(totalDuration / totalRuns) : 0;

  const totalCostUsd = runs.reduce((sum, r) => sum + (r.cost_usd ?? 0), 0);
  const totalTokensInput = runs.reduce((sum, r) => sum + (r.tokens_input ?? 0), 0);
  const totalTokensOutput = runs.reduce((sum, r) => sum + (r.tokens_output ?? 0), 0);

  return {
    data: {
      totalRuns,
      successCount,
      failedCount,
      partialCount,
      timeoutCount,
      successRate,
      avgDurationSeconds,
      totalCostUsd,
      totalTokensInput,
      totalTokensOutput,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// getAgentRunById
// Returns a single agent run by ID including full input/output data.
// ---------------------------------------------------------------------------

export async function getAgentRunById(
  client: SupabaseClient<Database>,
  runId: string
): Promise<{ data: AgentRun | null; error: Error | null }> {
  const { data, error } = await client
    .from('agent_runs')
    .select('*')
    .eq('id', runId)
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
// getCostBreakdown
// Returns cost aggregated per agent name for a given period.
// ---------------------------------------------------------------------------

export interface CostBreakdownItem {
  agent_name: string;
  total_cost: number;
  run_count: number;
  avg_cost: number;
  total_tokens: number;
}

export async function getCostBreakdown(
  client: SupabaseClient<Database>,
  periodDays: number = 7
): Promise<{ data: CostBreakdownItem[]; error: Error | null }> {
  const since = new Date();
  since.setDate(since.getDate() - periodDays);
  const sinceIso = since.toISOString();

  const { data, error } = await client
    .from('agent_runs')
    .select('agent_name, cost_usd, tokens_input, tokens_output')
    .gte('started_at', sinceIso);

  if (error !== null) {
    return { data: [], error: new Error(error.message) };
  }

  const runs = data ?? [];
  const grouped = new Map<string, { cost: number; count: number; tokens: number }>();

  for (const run of runs) {
    const existing = grouped.get(run.agent_name) ?? { cost: 0, count: 0, tokens: 0 };
    existing.cost += run.cost_usd ?? 0;
    existing.count += 1;
    existing.tokens += (run.tokens_input ?? 0) + (run.tokens_output ?? 0);
    grouped.set(run.agent_name, existing);
  }

  const breakdown: CostBreakdownItem[] = Array.from(grouped.entries())
    .map(([agent_name, { cost, count, tokens }]) => ({
      agent_name,
      total_cost: cost,
      run_count: count,
      avg_cost: count > 0 ? cost / count : 0,
      total_tokens: tokens,
    }))
    .sort((a, b) => b.total_cost - a.total_cost);

  return { data: breakdown, error: null };
}

// ---------------------------------------------------------------------------
// getDistinctAgentNames
// Returns all unique agent names from the agent_runs table.
// ---------------------------------------------------------------------------

export async function getDistinctAgentNames(
  client: SupabaseClient<Database>
): Promise<{ data: string[]; error: Error | null }> {
  const { data, error } = await client
    .from('agent_runs')
    .select('agent_name');

  if (error !== null) {
    return { data: [], error: new Error(error.message) };
  }

  const names = [...new Set((data ?? []).map((r) => r.agent_name))].sort();
  return { data: names, error: null };
}
