import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '../types';

type MarketOpportunity = Tables<'market_opportunities'>;
type OpportunityScore = Tables<'opportunity_scores'>;
type WatchlistVersion = Tables<'watchlist_versions'>;

export interface OpportunityWithScore extends MarketOpportunity {
  latest_score: OpportunityScore | null;
}

// ---------------------------------------------------------------------------
// getOpportunities
// Returns all active market opportunities, optionally filtered by industry.
// ---------------------------------------------------------------------------

export async function getOpportunities(
  client: SupabaseClient<Database>,
  options: {
    activeOnly?: boolean;
    targetIndustry?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data: MarketOpportunity[]; count: number | null; error: Error | null }> {
  const { activeOnly = true, targetIndustry, limit = 50, offset = 0 } = options;

  let query = client
    .from('market_opportunities')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  if (targetIndustry !== undefined) {
    query = query.eq('target_industry', targetIndustry);
  }

  const { data, count, error } = await query;

  if (error !== null) {
    return { data: [], count: null, error: new Error(error.message) };
  }

  return { data: data ?? [], count, error: null };
}

// ---------------------------------------------------------------------------
// getOpportunityById
// Returns a single market opportunity with its latest score.
// ---------------------------------------------------------------------------

export async function getOpportunityById(
  client: SupabaseClient<Database>,
  id: string
): Promise<{ data: OpportunityWithScore | null; error: Error | null }> {
  const { data: opportunity, error: opportunityError } = await client
    .from('market_opportunities')
    .select('*')
    .eq('id', id)
    .single();

  if (opportunityError !== null) {
    return { data: null, error: new Error(opportunityError.message) };
  }

  if (opportunity === null) {
    return { data: null, error: new Error(`Market opportunity not found: ${id}`) };
  }

  const { data: scores, error: scoresError } = await client
    .from('opportunity_scores')
    .select('*')
    .eq('market_opportunity_id', id)
    .order('scored_at', { ascending: false })
    .limit(1);

  if (scoresError !== null) {
    return { data: null, error: new Error(scoresError.message) };
  }

  const latestScore = scores !== null && scores.length > 0 ? (scores[0] ?? null) : null;

  return {
    data: {
      ...opportunity,
      latest_score: latestScore,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// getOpportunityScores
// Returns all scores for a given opportunity, newest first.
// ---------------------------------------------------------------------------

export async function getOpportunityScores(
  client: SupabaseClient<Database>,
  opportunityId: string
): Promise<{ data: OpportunityScore[]; error: Error | null }> {
  const { data, error } = await client
    .from('opportunity_scores')
    .select('*')
    .eq('market_opportunity_id', opportunityId)
    .order('scored_at', { ascending: false });

  if (error !== null) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data ?? [], error: null };
}

// ---------------------------------------------------------------------------
// getLatestWatchlist
// Returns the most recently published watchlist version.
// ---------------------------------------------------------------------------

export async function getLatestWatchlist(
  client: SupabaseClient<Database>
): Promise<{ data: WatchlistVersion | null; error: Error | null }> {
  const { data, error } = await client
    .from('watchlist_versions')
    .select('*')
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  if (error !== null) {
    if (error.code === 'PGRST116') {
      // No rows found
      return { data: null, error: null };
    }
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

// ---------------------------------------------------------------------------
// getWatchlistVersions
// Returns all watchlist versions, newest first.
// ---------------------------------------------------------------------------

export async function getWatchlistVersions(
  client: SupabaseClient<Database>,
  options: { limit?: number } = {}
): Promise<{ data: WatchlistVersion[]; error: Error | null }> {
  const { limit = 10 } = options;

  const { data, error } = await client
    .from('watchlist_versions')
    .select('*')
    .order('version_number', { ascending: false })
    .limit(limit);

  if (error !== null) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data ?? [], error: null };
}
