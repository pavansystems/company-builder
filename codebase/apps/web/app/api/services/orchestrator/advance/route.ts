import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PipelineOrchestratorService } from '@company-builder/agents';
import { GateEvaluator, TaskDispatcher, WatchdogTimer } from '@company-builder/core';
import type { AgentOutput } from '@company-builder/types';

export const maxDuration = 60;

interface AdvanceRequestBody {
  pipelineItemId: string;
  agentName: string;
  output: AgentOutput;
}

/**
 * POST /api/services/orchestrator/advance
 *
 * Notifies the orchestrator that an agent has completed, advancing the pipeline item.
 * Called by the orchestrator callback or manually.
 *
 * Body: { pipelineItemId: string; agentName: string; output: AgentOutput }
 * Returns: { success: boolean; pipelineItemId: string; updatedItem: ... }
 */
export async function POST(request: NextRequest) {
  // Validate auth — require cron secret or authenticated user
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isCronRequest =
    cronSecret !== undefined &&
    cronSecret.length > 0 &&
    authHeader === `Bearer ${cronSecret}`;

  if (!isCronRequest) {
    // For non-cron requests, require service role key (internal service-to-service)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let body: AdvanceRequestBody;
  try {
    body = (await request.json()) as AdvanceRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { pipelineItemId, agentName, output } = body;

  if (!pipelineItemId || !agentName || !output) {
    return NextResponse.json(
      { error: 'Missing required fields: pipelineItemId, agentName, output' },
      { status: 400 },
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const orchestrator = new PipelineOrchestratorService(
    supabase,
    new TaskDispatcher(
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      process.env.CRON_SECRET ?? '',
    ),
    new GateEvaluator(supabase),
    new WatchdogTimer(supabase),
  );

  try {
    await orchestrator.handleAgentCompletion(pipelineItemId, agentName, output);

    // Fetch updated item to return
    const { data: updatedItem } = await supabase
      .from('pipeline_items')
      .select('id, current_phase, current_step, status')
      .eq('id', pipelineItemId)
      .single();

    return NextResponse.json({
      success: true,
      pipelineItemId,
      updatedItem,
    });
  } catch (error) {
    console.error('[orchestrator/advance] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
