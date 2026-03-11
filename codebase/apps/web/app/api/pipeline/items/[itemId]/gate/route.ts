import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PrerequisiteChecker } from '@company-builder/core';
import type { GateDecisionInsert, PipelineItem, PipelinePhase } from '@company-builder/types';

interface RouteParams {
  params: { itemId: string };
}

// ---------------------------------------------------------------------------
// GET /api/pipeline/items/[itemId]/gate
// Returns gate context: item details, scores, dimensions, and agent outputs.
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { itemId } = params;

    // Fetch the pipeline item
    const { data: item, error: itemError } = await supabase
      .from('pipeline_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Pipeline item not found' }, { status: 404 });
    }

    // Fetch agent runs for this item
    const { data: agentRuns } = await supabase
      .from('agent_runs')
      .select('*')
      .eq('pipeline_item_id', itemId)
      .order('started_at', { ascending: false });

    // Fetch gate decisions for this item
    const { data: gateDecisions } = await supabase
      .from('gate_decisions')
      .select('*')
      .eq('pipeline_item_id', itemId)
      .order('decided_at', { ascending: false });

    // Fetch scores based on item type
    let scores = null;
    if (item.concept_id) {
      const { data } = await supabase
        .from('concept_scores')
        .select('*')
        .eq('concept_id', item.concept_id)
        .order('scored_at', { ascending: false })
        .limit(1)
        .single();
      scores = data;
    } else if (item.market_opportunity_id) {
      const { data } = await supabase
        .from('opportunity_scores')
        .select('*')
        .eq('market_opportunity_id', item.market_opportunity_id)
        .order('scored_at', { ascending: false })
        .limit(1)
        .single();
      scores = data;
    }

    // Fetch applicable gate rule and check prerequisites for next phase
    const PHASE_PROGRESSION: Record<string, string> = {
      phase_0: 'phase_1',
      phase_1: 'phase_2',
      phase_2: 'phase_3',
    };

    let gateRule = null;
    let prerequisites = null;
    if (item.current_phase) {
      const nextPhase = PHASE_PROGRESSION[item.current_phase];
      if (nextPhase) {
        const { data } = await supabase
          .from('gate_rules')
          .select('*')
          .eq('phase_from', item.current_phase)
          .eq('phase_to', nextPhase)
          .single();
        gateRule = data;

        // Check prerequisites for the next phase so reviewers can see what's missing
        const checker = new PrerequisiteChecker(supabase);
        prerequisites = await checker.checkPrerequisites(
          item as unknown as PipelineItem,
          nextPhase as PipelinePhase,
        );
      }
    }

    return NextResponse.json({
      item,
      agentRuns: agentRuns ?? [],
      gateDecisions: gateDecisions ?? [],
      scores,
      gateRule,
      prerequisites,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user for account isolation
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      account_id: user.id,
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
