import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { GateDecisionInsert } from '@company-builder/types';

interface RouteParams {
  params: { itemId: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { itemId } = params;
    const body = await request.json();

    const { action, notes } = body as {
      action: 'approve' | 'reject';
      notes?: string;
    };

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Verify item exists and get current phase
    const { data: item, error: itemError } = await supabase
      .from('pipeline_items')
      .select('id, current_phase, status')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Pipeline item not found' }, { status: 404 });
    }

    const decision: GateDecisionInsert = {
      pipeline_item_id: itemId,
      gate_phase: item.current_phase,
      decision: action === 'approve' ? 'pass' : 'fail',
      decision_reason: notes ?? null,
      decided_at: new Date().toISOString(),
    };

    // Create gate decision record
    const { data: gateDecision, error: gateError } = await supabase
      .from('gate_decisions')
      .insert(decision)
      .select()
      .single();

    if (gateError) {
      return NextResponse.json({ error: gateError.message }, { status: 500 });
    }

    // Determine next status based on action
    const PHASE_PROGRESSION: Record<string, string> = {
      phase_0: 'phase_1',
      phase_1: 'phase_2',
      phase_2: 'phase_3',
    };

    const nextStatus = action === 'approve' ? 'in_progress' : 'failed';
    const nextPhase =
      action === 'approve'
        ? (PHASE_PROGRESSION[item.current_phase ?? ''] ?? item.current_phase)
        : item.current_phase;

    const now = new Date().toISOString();
    type PhaseKey = 'phase_0' | 'phase_1' | 'phase_2' | 'phase_3' | 'rejected' | 'archived';
    const { data: updatedItem, error: updateError } = await supabase
      .from('pipeline_items')
      .update({
        status: nextStatus as 'in_progress' | 'failed',
        last_gate_decision: (action === 'approve' ? 'pass' : 'fail') as 'pass' | 'fail',
        last_gate_at: now,
        last_gate_reason: notes ?? null,
        ...(action === 'approve' && nextPhase !== item.current_phase
          ? { current_phase: nextPhase as PhaseKey, entered_phase_at: now }
          : {}),
      })
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Note: pipeline_events table not in schema — gate decision record serves as the audit trail

    return NextResponse.json({ gateDecision, item: updatedItem }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
