import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '../types';

type Concept = Tables<'concepts'>;
type ConceptScore = Tables<'concept_scores'>;

export interface ConceptWithScore extends Concept {
  latest_score: ConceptScore | null;
}

// ---------------------------------------------------------------------------
// getConcepts
// Returns concepts, optionally filtered by opportunity or status flags.
// ---------------------------------------------------------------------------

export async function getConcepts(
  client: SupabaseClient<Database>,
  options: {
    marketOpportunityId?: string;
    activeOnly?: boolean;
    selectedOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data: Concept[]; count: number | null; error: Error | null }> {
  const {
    marketOpportunityId,
    activeOnly = true,
    selectedOnly = false,
    limit = 50,
    offset = 0,
  } = options;

  let query = client
    .from('concepts')
    .select('*', { count: 'exact' })
    .order('generated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (marketOpportunityId !== undefined) {
    query = query.eq('market_opportunity_id', marketOpportunityId);
  }

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  if (selectedOnly) {
    query = query.eq('selected_for_validation', true);
  }

  const { data, count, error } = await query;

  if (error !== null) {
    return { data: [], count: null, error: new Error(error.message) };
  }

  return { data: data ?? [], count, error: null };
}

// ---------------------------------------------------------------------------
// getConceptById
// Returns a single concept with its latest score.
// ---------------------------------------------------------------------------

export async function getConceptById(
  client: SupabaseClient<Database>,
  id: string
): Promise<{ data: ConceptWithScore | null; error: Error | null }> {
  const { data: concept, error: conceptError } = await client
    .from('concepts')
    .select('*')
    .eq('id', id)
    .single();

  if (conceptError !== null) {
    return { data: null, error: new Error(conceptError.message) };
  }

  if (concept === null) {
    return { data: null, error: new Error(`Concept not found: ${id}`) };
  }

  const { data: scores, error: scoresError } = await client
    .from('concept_scores')
    .select('*')
    .eq('concept_id', id)
    .order('scored_at', { ascending: false })
    .limit(1);

  if (scoresError !== null) {
    return { data: null, error: new Error(scoresError.message) };
  }

  const latestScore = scores !== null && scores.length > 0 ? (scores[0] ?? null) : null;

  return {
    data: {
      ...concept,
      latest_score: latestScore,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// getConceptScores
// Returns all scores for a given concept, newest first.
// ---------------------------------------------------------------------------

export async function getConceptScores(
  client: SupabaseClient<Database>,
  conceptId: string
): Promise<{ data: ConceptScore[]; error: Error | null }> {
  const { data, error } = await client
    .from('concept_scores')
    .select('*')
    .eq('concept_id', conceptId)
    .order('scored_at', { ascending: false });

  if (error !== null) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data ?? [], error: null };
}

// ---------------------------------------------------------------------------
// getConceptsWithScores
// Returns all concepts for an opportunity with their latest scores.
// ---------------------------------------------------------------------------

export async function getConceptsWithScores(
  client: SupabaseClient<Database>,
  marketOpportunityId: string
): Promise<{ data: ConceptWithScore[]; error: Error | null }> {
  const { data: concepts, error: conceptsError } = await client
    .from('concepts')
    .select('*')
    .eq('market_opportunity_id', marketOpportunityId)
    .eq('is_active', true)
    .order('generated_at', { ascending: false });

  if (conceptsError !== null) {
    return { data: [], error: new Error(conceptsError.message) };
  }

  if (concepts === null || concepts.length === 0) {
    return { data: [], error: null };
  }

  const conceptIds = concepts.map((c) => c.id);

  // Fetch the latest score for each concept via a single query
  const { data: allScores, error: scoresError } = await client
    .from('concept_scores')
    .select('*')
    .in('concept_id', conceptIds)
    .order('scored_at', { ascending: false });

  if (scoresError !== null) {
    return { data: [], error: new Error(scoresError.message) };
  }

  // Group scores by concept_id, keeping only the latest per concept
  const latestScoreByConceptId = new Map<string, ConceptScore>();
  for (const score of allScores ?? []) {
    if (!latestScoreByConceptId.has(score.concept_id)) {
      latestScoreByConceptId.set(score.concept_id, score);
    }
  }

  const result: ConceptWithScore[] = concepts.map((concept) => ({
    ...concept,
    latest_score: latestScoreByConceptId.get(concept.id) ?? null,
  }));

  return { data: result, error: null };
}
