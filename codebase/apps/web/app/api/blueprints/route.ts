import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data: blueprints, error } = await supabase
    .from('blueprints')
    .select('id, concept_id, executive_summary, is_finalized, created_at, revenue_model, runway_months')
    .eq('is_finalized', true)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with concept names
  const conceptIds = (blueprints ?? []).map((b) => b.concept_id).filter(Boolean);
  let conceptMap = new Map<string, string>();

  if (conceptIds.length > 0) {
    const { data: concepts } = await supabase
      .from('concepts')
      .select('id, title')
      .in('id', conceptIds);
    conceptMap = new Map((concepts ?? []).map((c) => [c.id, c.title]));
  }

  const result = (blueprints ?? []).map((b) => ({
    ...b,
    conceptTitle: conceptMap.get(b.concept_id ?? '') ?? null,
  }));

  return NextResponse.json(result);
}
