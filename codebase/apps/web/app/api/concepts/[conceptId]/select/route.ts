import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ conceptId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { conceptId } = await params;
  const body = await req.json() as { action: 'advance' | 'reject'; notes?: string };
  const supabase = await createServerSupabaseClient();

  if (body.action === 'advance') {
    const { error } = await supabase
      .from('concepts')
      .update({ selected_for_validation: true })
      .eq('id', conceptId);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Update pipeline item
    await supabase
      .from('pipeline_items')
      .update({
        current_phase: 'phase_2',
        status: 'in_progress',
        last_gate_decision: 'pass',
        last_gate_at: new Date().toISOString(),
        last_gate_reason: body.notes ?? 'Manually advanced to validation',
      })
      .eq('concept_id', conceptId);

    return NextResponse.json({ success: true, action: 'advance' });
  }

  if (body.action === 'reject') {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('concepts')
      .update({ archived_at: now, is_active: false })
      .eq('id', conceptId);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await supabase
      .from('pipeline_items')
      .update({
        current_phase: 'rejected',
        status: 'failed',
        last_gate_decision: 'fail',
        last_gate_at: now,
        last_gate_reason: body.notes ?? 'Rejected at concept review gate',
      })
      .eq('concept_id', conceptId);

    return NextResponse.json({ success: true, action: 'reject' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
