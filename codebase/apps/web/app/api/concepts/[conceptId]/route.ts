import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ conceptId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { conceptId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: concept, error } = await supabase
    .from('concepts')
    .select('*')
    .eq('id', conceptId)
    .single();

  if (error || !concept) {
    return NextResponse.json({ error: 'Concept not found' }, { status: 404 });
  }

  const [{ data: score }, { data: opportunity }, { data: pipelineItem }] = await Promise.all([
    supabase.from('concept_scores').select('*').eq('concept_id', conceptId).single(),
    supabase
      .from('market_opportunities')
      .select('id, title, problem_statement')
      .eq('id', concept.market_opportunity_id)
      .single(),
    supabase
      .from('pipeline_items')
      .select('id, status, current_phase, last_gate_decision')
      .eq('concept_id', conceptId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  return NextResponse.json({
    concept,
    score: score ?? null,
    opportunity: opportunity ?? null,
    pipelineItem: pipelineItem ?? null,
  });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { conceptId } = await params;
  const body = await req.json();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('concepts')
    .update(body)
    .eq('id', conceptId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(data);
}
