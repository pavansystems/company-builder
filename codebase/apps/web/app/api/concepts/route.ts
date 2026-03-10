import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const opportunityId = searchParams.get('opportunityId');
  const status = searchParams.get('status');
  const minScore = searchParams.get('minScore');

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('concepts')
    .select('*')
    .order('generated_at', { ascending: false });

  if (opportunityId) {
    query = query.eq('market_opportunity_id', opportunityId);
  }
  if (status === 'selected') {
    query = query.eq('selected_for_validation', true);
  } else if (status === 'active') {
    query = query.eq('is_active', true).eq('selected_for_validation', false).is('archived_at', null);
  } else if (status === 'archived') {
    query = query.not('archived_at', 'is', null);
  }

  const { data: concepts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let scores: Record<string, unknown>[] = [];
  if (concepts && concepts.length > 0) {
    const conceptIds = concepts.map((c) => c.id);
    const { data: scoreRows } = await supabase
      .from('concept_scores')
      .select('*')
      .in('concept_id', conceptIds);
    scores = scoreRows ?? [];
  }

  const scoreMap = new Map((scores as any[]).map((s: any) => [s.concept_id, s]));

  let result = (concepts ?? []).map((concept) => ({
    concept,
    score: scoreMap.get(concept.id) ?? null,
  }));

  if (minScore) {
    const threshold = parseFloat(minScore);
    result = result.filter(
      ({ score }) => score && (score as any).composite_score >= threshold
    );
  }

  return NextResponse.json(result);
}
