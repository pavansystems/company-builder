import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ blueprintId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { blueprintId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: blueprint, error } = await supabase
    .from('blueprints')
    .select('*')
    .eq('id', blueprintId)
    .single();

  if (error || !blueprint) {
    return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
  }

  const { data: concept } = await supabase
    .from('concepts')
    .select('id, title, summary, target_customer_segment')
    .eq('id', blueprint.concept_id)
    .single();

  return NextResponse.json({ blueprint, concept: concept ?? null });
}
