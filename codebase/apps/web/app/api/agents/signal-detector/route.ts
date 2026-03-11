import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SignalDetectorAgent } from '@company-builder/agents';
import type { AgentInput } from '@company-builder/types';
import { logger } from '@company-builder/core';
import { handleAgentError } from '../_shared/errorHandler';

const log = logger.child({ service: 'api', route: 'signal-detector' });

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Check for Vercel cron secret first (allows cron to bypass user auth)
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isCronRequest =
    cronSecret !== undefined &&
    cronSecret.length > 0 &&
    authHeader === `Bearer ${cronSecret}`;

  if (!isCronRequest) {
    // Require authenticated user for non-cron requests
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let input: AgentInput;
  try {
    input = (await request.json()) as AgentInput;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const agent = new SignalDetectorAgent({
    name: 'signal-detector',
    description:
      'Analyzes content items to detect disruption signals indicating emerging opportunities for agent-first automation.',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  });

  log.info('Request received', { pipelineItemId: input.pipeline_item_id });

  try {
    const output = await agent.run(input);
    log.info('Agent completed', {
      pipelineItemId: input.pipeline_item_id,
      tokensUsed: output.tokens_used,
      costUsd: output.cost_usd,
      durationMs: output.duration_ms,
    });
    return NextResponse.json(output);
  } catch (error) {
    log.error('Agent failed', {
      pipelineItemId: input.pipeline_item_id,
      error: error instanceof Error ? error.message : String(error),
    });
    return handleAgentError(error);
  }
}
