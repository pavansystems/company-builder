import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PipelineOrchestratorService } from '@company-builder/agents';
import { GateEvaluator, TaskDispatcher, WatchdogTimer } from '@company-builder/core';
import type { AgentOutput } from '@company-builder/types';

export const maxDuration = 60;

interface CallbackBody {
  pipelineItemId: string;
  agentName: string;
  output: AgentOutput;
}

/**
 * POST /api/services/orchestrator/callback
 *
 * Fire-and-forget callback endpoint called by agents when they complete a step.
 * Validates the CRON_SECRET or service-role key, then delegates to
 * PipelineOrchestratorService.handleAgentCompletion().
 *
 * Body: { pipelineItemId: string; agentName: string; output: AgentOutput }
 * Returns: { received: true } immediately (the real work is async)
 */
export async function POST(request: NextRequest) {
  // Validate caller — accept cron secret or service role key (internal service-to-service)
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isCronRequest =
    cronSecret !== undefined &&
    cronSecret.length > 0 &&
    authHeader === `Bearer ${cronSecret}`;

  const isServiceRequest =
    serviceKey !== undefined &&
    serviceKey.length > 0 &&
    authHeader === `Bearer ${serviceKey}`;

  if (!isCronRequest && !isServiceRequest) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CallbackBody;
  try {
    body = (await request.json()) as CallbackBody;
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing Supabase environment variables' },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const orchestrator = new PipelineOrchestratorService(
    supabase,
    new TaskDispatcher(
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      process.env.CRON_SECRET ?? '',
    ),
    new GateEvaluator(supabase),
    new WatchdogTimer(supabase),
  );

  // Process completion in background — do not await so the agent gets a fast response
  orchestrator.handleAgentCompletion(pipelineItemId, agentName, output).catch((error) => {
    console.error(
      `[orchestrator/callback] handleAgentCompletion failed for item=${pipelineItemId} agent=${agentName}:`,
      error,
    );
  });

  return NextResponse.json({ received: true });
}
