import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FeedbackLoopService } from '@company-builder/agents';

export const maxDuration = 300;

/**
 * GET /api/cron/feedback-loop
 *
 * Vercel cron endpoint — fires weekly (every Sunday at midnight UTC).
 * Validates CRON_SECRET header, then runs FeedbackLoopService.aggregateOutcomes()
 * to compute calibration metrics and optionally apply threshold adjustments.
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

  const feedbackService = new FeedbackLoopService(supabase);

  const startedAt = Date.now();

  try {
    // Aggregate outcomes over the past 30 days
    const summary = await feedbackService.aggregateOutcomes(30);

    // Apply calibration for high-confidence suggestions
    await feedbackService.applyCalibration(summary.thresholdSuggestions);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
      lookback_days: 30,
      summary: {
        analysis_run_at: summary.analysisRunAt,
        phase0_advancement_rate: summary.phase0AdvancementRate,
        phase1_advancement_rate: summary.phase1AdvancementRate,
        phase2_advancement_rate: summary.phase2AdvancementRate,
        total_blueprints_completed: summary.totalBlueprintsCompleted,
        total_concepts_analyzed: summary.totalConceptsAnalyzed,
        highest_error_rate_agent: summary.highestErrorRateAgent,
        agent_error_rates: summary.agentErrorRates,
        threshold_suggestions: summary.thresholdSuggestions,
      },
      calibration: {
        suggestions_evaluated: summary.thresholdSuggestions.length,
      },
    });
  } catch (error) {
    console.error('[cron/feedback-loop] Feedback loop failed:', error);
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
