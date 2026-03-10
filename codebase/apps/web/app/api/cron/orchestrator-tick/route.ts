import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PipelineOrchestratorService } from '@company-builder/agents';
import { GateEvaluator, TaskDispatcher, WatchdogTimer } from '@company-builder/core';

export const maxDuration = 60;

/**
 * GET /api/cron/orchestrator-tick
 *
 * Vercel cron endpoint — fires every minute.
 * Validates CRON_SECRET header, then calls PipelineOrchestratorService.tick()
 * which advances all pending/in-progress pipeline items one step forward.
 *
 * Security: requires Authorization: Bearer <CRON_SECRET> header.
 * Configured in vercel.json under "crons".
 */
export async function GET(request: NextRequest) {
  // Validate cron secret
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (
    cronSecret === undefined ||
    cronSecret.length === 0 ||
    authHeader !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      process.env.NEXT_PUBLIC_APP_URL ?? `https://${request.headers.get('host') ?? 'localhost'}`,
      cronSecret,
    ),
    new GateEvaluator(supabase),
    new WatchdogTimer(supabase),
  );

  const startedAt = Date.now();

  try {
    const result = await orchestrator.tick();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
      ...result,
    });
  } catch (error) {
    console.error('[cron/orchestrator-tick] Tick failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        duration_ms: Date.now() - startedAt,
      },
      { status: 500 },
    );
  }
}
