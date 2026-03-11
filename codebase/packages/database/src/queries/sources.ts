import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables, InsertDTO, UpdateDTO } from '../types';

type Source = Tables<'sources'>;

// ---------------------------------------------------------------------------
// getSources
// Returns all configured content sources, newest first.
// ---------------------------------------------------------------------------

export async function getSources(
  client: SupabaseClient<Database>,
  options: { activeOnly?: boolean; limit?: number } = {}
): Promise<{ data: Source[]; error: Error | null }> {
  const { activeOnly = false, limit = 200 } = options;

  let query = client
    .from('sources')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error !== null) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data ?? [], error: null };
}

// ---------------------------------------------------------------------------
// getSourceById
// Returns a single source by ID.
// ---------------------------------------------------------------------------

export async function getSourceById(
  client: SupabaseClient<Database>,
  id: string
): Promise<{ data: Source | null; error: Error | null }> {
  const { data, error } = await client
    .from('sources')
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
// createSource
// Inserts a new content source.
// ---------------------------------------------------------------------------

export async function createSource(
  client: SupabaseClient<Database>,
  input: InsertDTO<'sources'>
): Promise<{ data: Source | null; error: Error | null }> {
  const { data, error } = await client
    .from('sources')
    .insert(input)
    .select()
    .single();

  if (error !== null) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

// ---------------------------------------------------------------------------
// updateSource
// Updates an existing content source.
// ---------------------------------------------------------------------------

export async function updateSource(
  client: SupabaseClient<Database>,
  id: string,
  updates: UpdateDTO<'sources'>
): Promise<{ data: Source | null; error: Error | null }> {
  const { data, error } = await client
    .from('sources')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error !== null) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

// ---------------------------------------------------------------------------
// deleteSource
// Deletes a content source by ID.
// ---------------------------------------------------------------------------

export async function deleteSource(
  client: SupabaseClient<Database>,
  id: string
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from('sources')
    .delete()
    .eq('id', id);

  if (error !== null) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}
