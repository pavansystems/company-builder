import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

interface GateDecisionBody {
  pipelineItemId: string;
  action: 'approve' | 'reject';
  reviewerId: string;
  notes?: string;
}

/**
 * POST /api/services/orchestrator/gate
 *
 * Handles human gate decisions — approve or reject a pipeline item
 * that is currently in 'blocked' status waiting for human review.
 *
 * Body: { pipelineItemId: string; action: 'approve'|'reject'; reviewerId: string; notes?: string }
 * Returns: { success: boolean; pipelineItemId: string; action: string; updatedItem: ... }
 */
export async function POST(request: NextRequest) {
  // Require authenticated user for human gate decisions
  const supabaseUser = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: GateDecisionBody;
  try {
    body = (await request.json()) as GateDecisionBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { pipelineItemId, action, reviewerId, notes } = body;

  if (!pipelineItemId || !action || !reviewerId) {
    return NextResponse.json(
      { error: 'Missing required fields: pipelineItemId, action, reviewerId' },
      { status: 400 },
    );
  }

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json(
      { error: 'action must be "approve" or "reject"' },
      { status: 400 },
    );
  }

  // Use service role for writes
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  // Load current item state
  const { data: itemData, error: itemError } = await supabase
    .from('pipeline_items')
    .select('*')
    .eq('id', pipelineItemId)
    .single();

  if (itemError !== null || itemData === null) {
    return NextResponse.json(
      { error: `Pipeline item ${pipelineItemId} not found` },
      { status: 404 },
    );
  }

  const item = itemData as {
    id: string;
    current_phase: string | null;
    status: string | null;
  };

  // Validate item is in a reviewable state
  if (item.status !== 'blocked') {
    return NextResponse.json(
      {
        error: `Pipeline item is in status '${item.status}', not 'blocked'. Only blocked items can receive gate decisions.`,
      },
      { status: 409 },
    );
  }

  const decidedAt = new Date().toISOString();

  // Determine phase transition
  const phaseMap: Record<string, string> = {
    phase_0: 'phase_1',
    phase_1: 'phase_2',
    phase_2: 'phase_3',
  };

  const nextPhase = item.current_phase ? phaseMap[item.current_phase] : null;

  // Record gate decision
  await supabase.from('gate_decisions').insert({
    pipeline_item_id: pipelineItemId,
    gate_phase: item.current_phase,
    decision: action === 'approve' ? 'override_pass' : 'override_fail',
    decision_by: reviewerId,
    decision_reason: notes ?? null,
    override_reason: `Human review: ${action}`,
    decided_at: decidedAt,
    account_id: user.id,
  });

  // Update pipeline item based on action
  if (action === 'approve' && nextPhase) {
    // Determine first step of next phase
    const phaseSteps: Record<string, string> = {
      phase_1: 'landscape-analyst',
      phase_2: 'market-sizer',
      phase_3: 'business-designer',
    };
    const firstStep = phaseSteps[nextPhase] ?? null;

    await supabase
      .from('pipeline_items')
      .update({
        current_phase: nextPhase,
        current_step: firstStep,
        status: 'pending',
        last_gate_decision: 'approved',
        last_gate_at: decidedAt,
        last_gate_reason: notes ?? 'Human reviewer approved',
        last_gate_by: reviewerId,
        entered_phase_at: decidedAt,
        entered_step_at: decidedAt,
      })
      .eq('id', pipelineItemId);
  } else {
    // Reject — archive the item
    await supabase
      .from('pipeline_items')
      .update({
        status: 'failed',
        current_phase: 'rejected',
        last_gate_decision: 'rejected',
        last_gate_at: decidedAt,
        last_gate_reason: notes ?? 'Human reviewer rejected',
        last_gate_by: reviewerId,
      })
      .eq('id', pipelineItemId);
  }

  // Log pipeline event
  await supabase.from('pipeline_events').insert({
    pipeline_item_id: pipelineItemId,
    event_type: 'human_gate_decision',
    payload: {
      action,
      reviewerId,
      notes,
      fromPhase: item.current_phase,
      toPhase: action === 'approve' ? nextPhase : 'rejected',
    },
    created_at: decidedAt,
  });

  // Fetch updated item
  const { data: updatedItem } = await supabase
    .from('pipeline_items')
    .select('id, current_phase, current_step, status, last_gate_decision')
    .eq('id', pipelineItemId)
    .single();

  return NextResponse.json({
    success: true,
    pipelineItemId,
    action,
    updatedItem,
  });
}
