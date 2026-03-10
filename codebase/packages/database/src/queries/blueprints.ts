import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '../types';

type Blueprint = Tables<'blueprints'>;

// ---------------------------------------------------------------------------
// getBlueprints
// Returns blueprints with optional filters.
// ---------------------------------------------------------------------------

export async function getBlueprints(
  client: SupabaseClient<Database>,
  options: {
    conceptId?: string;
    finalizedOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data: Blueprint[]; count: number | null; error: Error | null }> {
  const { conceptId, finalizedOnly = false, limit = 50, offset = 0 } = options;

  let query = client
    .from('blueprints')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (conceptId !== undefined) {
    query = query.eq('concept_id', conceptId);
  }

  if (finalizedOnly) {
    query = query.eq('is_finalized', true);
  }

  const { data, count, error } = await query;

  if (error !== null) {
    return { data: [], count: null, error: new Error(error.message) };
  }

  return { data: data ?? [], count, error: null };
}

// ---------------------------------------------------------------------------
// getBlueprintById
// Returns a single blueprint by ID.
// ---------------------------------------------------------------------------

export async function getBlueprintById(
  client: SupabaseClient<Database>,
  id: string
): Promise<{ data: Blueprint | null; error: Error | null }> {
  const { data, error } = await client
    .from('blueprints')
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
// getBlueprintByConceptId
// Returns the most recent blueprint for a given concept.
// ---------------------------------------------------------------------------

export async function getBlueprintByConceptId(
  client: SupabaseClient<Database>,
  conceptId: string
): Promise<{ data: Blueprint | null; error: Error | null }> {
  const { data, error } = await client
    .from('blueprints')
    .select('*')
    .eq('concept_id', conceptId)
    .order('created_at', { ascending: false })
    .limit(1)
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
// getFinalizedBlueprints
// Returns all finalized blueprints, ordered by finalization date.
// ---------------------------------------------------------------------------

export async function getFinalizedBlueprints(
  client: SupabaseClient<Database>,
  options: { limit?: number } = {}
): Promise<{ data: Blueprint[]; error: Error | null }> {
  const { limit = 20 } = options;

  const { data, error } = await client
    .from('blueprints')
    .select('*')
    .eq('is_finalized', true)
    .order('finalized_at', { ascending: false })
    .limit(limit);

  if (error !== null) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data ?? [], error: null };
}
