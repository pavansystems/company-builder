import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '../types';

type Validation = Tables<'validations'>;

// ---------------------------------------------------------------------------
// getValidations
// Returns validations with optional filters.
// ---------------------------------------------------------------------------

export async function getValidations(
  client: SupabaseClient<Database>,
  options: {
    conceptId?: string;
    phase?: Validation['validation_phase'];
    verdict?: Validation['verdict'];
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ data: Validation[]; count: number | null; error: Error | null }> {
  const { conceptId, phase, verdict, limit = 50, offset = 0 } = options;

  let query = client
    .from('validations')
    .select('*', { count: 'exact' })
    .order('validated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (conceptId !== undefined) {
    query = query.eq('concept_id', conceptId);
  }

  if (phase !== undefined && phase !== null) {
    query = query.eq('validation_phase', phase);
  }

  if (verdict !== undefined && verdict !== null) {
    query = query.eq('verdict', verdict);
  }

  const { data, count, error } = await query;

  if (error !== null) {
    return { data: [], count: null, error: new Error(error.message) };
  }

  return { data: data ?? [], count, error: null };
}

// ---------------------------------------------------------------------------
// getValidationsByConceptId
// Returns all validation records for a specific concept, ordered by phase.
// ---------------------------------------------------------------------------

export async function getValidationsByConceptId(
  client: SupabaseClient<Database>,
  conceptId: string
): Promise<{ data: Validation[]; error: Error | null }> {
  const { data, error } = await client
    .from('validations')
    .select('*')
    .eq('concept_id', conceptId)
    .order('validated_at', { ascending: true });

  if (error !== null) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data ?? [], error: null };
}

// ---------------------------------------------------------------------------
// getValidationById
// Returns a single validation record.
// ---------------------------------------------------------------------------

export async function getValidationById(
  client: SupabaseClient<Database>,
  id: string
): Promise<{ data: Validation | null; error: Error | null }> {
  const { data, error } = await client
    .from('validations')
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
// getValidationSynthesis
// Returns the synthesis-phase validation record for a concept, if it exists.
// This is the final go/no-go verdict row.
// ---------------------------------------------------------------------------

export async function getValidationSynthesis(
  client: SupabaseClient<Database>,
  conceptId: string
): Promise<{ data: Validation | null; error: Error | null }> {
  const { data, error } = await client
    .from('validations')
    .select('*')
    .eq('concept_id', conceptId)
    .eq('validation_phase', 'synthesis')
    .order('validated_at', { ascending: false })
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
