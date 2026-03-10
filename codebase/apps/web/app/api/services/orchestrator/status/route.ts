import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const maxDuration = 60;

interface PhaseStatusCount {
  phase: string;
  pending: number;
  in_progress: number;
  completed: number;
  failed: number;
  blocked: number;
  total: number;
}

interface PipelineStatusResponse {
  timestamp: string;
  phases: PhaseStatusCount[];
  recentItems: Array<{
    id: string;
    item_type: string | null;
    current_phase: string | null;
    current_step: string | null;
    status: string | null;
    entered_phase_at: string | null;
  }>;
  blockedItems: Array<{
    id: string;
    current_phase: string | null;
    current_step: string | null;
    last_gate_decision: string | null;
    last_gate_reason: string | null;
    entered_step_at: string | null;
  }>;
  summary: {
    totalActive: number;
    totalBlocked: number;
    totalCompleted: number;
    totalRejected: number;
  };
}

/**
 * GET /api/services/orchestrator/status
 *
 * Returns a pipeline overview: items grouped by phase and status.
 * Requires authenticated user.
 */
export async function GET(request: NextRequest) {
  // Suppress unused variable warning — request is required by Next.js route signature
  void request;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const phases = ['phase_0', 'phase_1', 'phase_2', 'phase_3'] as const;
  const statuses = ['pending', 'in_progress', 'completed', 'failed', 'blocked'] as const;

  // Fetch all pipeline items (limited to active and recent)
  const { data: allItems, error: itemsError } = await supabase
    .from('pipeline_items')
    .select('id, item_type, current_phase, current_step, status, entered_phase_at, entered_step_at, last_gate_decision, last_gate_reason')
    .in('current_phase', [...phases, 'rejected', 'archived'])
    .order('entered_phase_at', { ascending: false })
    .limit(500);

  if (itemsError !== null) {
    return NextResponse.json(
      { error: `Failed to fetch pipeline status: ${itemsError.message}` },
      { status: 500 },
    );
  }

  const items = (allItems ?? []) as Array<{
    id: string;
    item_type: string | null;
    current_phase: string | null;
    current_step: string | null;
    status: string | null;
    entered_phase_at: string | null;
    entered_step_at: string | null;
    last_gate_decision: string | null;
    last_gate_reason: string | null;
  }>;

  // Group by phase and status
  const phaseCounts: PhaseStatusCount[] = phases.map((phase) => {
    const phaseItems = items.filter((i) => i.current_phase === phase);
    const counts: PhaseStatusCount = {
      phase,
      pending: 0,
      in_progress: 0,
      completed: 0,
      failed: 0,
      blocked: 0,
      total: phaseItems.length,
    };
    for (const item of phaseItems) {
      const status = item.status as typeof statuses[number] | null;
      if (status && status in counts) {
        counts[status]++;
      }
    }
    return counts;
  });

  // Recent items (last 20 active)
  const recentItems = items
    .filter((i) => i.status !== 'completed' && i.current_phase !== 'rejected')
    .slice(0, 20)
    .map((i) => ({
      id: i.id,
      item_type: i.item_type,
      current_phase: i.current_phase,
      current_step: i.current_step,
      status: i.status,
      entered_phase_at: i.entered_phase_at,
    }));

  // Blocked items needing human attention
  const blockedItems = items
    .filter((i) => i.status === 'blocked')
    .slice(0, 50)
    .map((i) => ({
      id: i.id,
      current_phase: i.current_phase,
      current_step: i.current_step,
      last_gate_decision: i.last_gate_decision,
      last_gate_reason: i.last_gate_reason,
      entered_step_at: i.entered_step_at,
    }));

  // Summary counts
  const totalActive = items.filter(
    (i) =>
      (i.status === 'pending' || i.status === 'in_progress') &&
      i.current_phase !== 'rejected',
  ).length;
  const totalBlocked = items.filter((i) => i.status === 'blocked').length;
  const totalCompleted = items.filter((i) => i.status === 'completed').length;
  const totalRejected = items.filter((i) => i.current_phase === 'rejected').length;

  const response: PipelineStatusResponse = {
    timestamp: new Date().toISOString(),
    phases: phaseCounts,
    recentItems,
    blockedItems,
    summary: {
      totalActive,
      totalBlocked,
      totalCompleted,
      totalRejected,
    },
  };

  return NextResponse.json(response);
}
