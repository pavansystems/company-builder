import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const periodDays = parseInt(searchParams.get('period_days') ?? '7', 10);

    const since = new Date();
    since.setDate(since.getDate() - periodDays);
    const sinceIso = since.toISOString();

    // Fetch all runs in period for stats
    const { data: runs, error: runsError } = await supabase
      .from('agent_runs')
      .select('agent_name, status, execution_duration_seconds, cost_usd, tokens_input, tokens_output')
      .gte('started_at', sinceIso);

    if (runsError) {
      return NextResponse.json({ error: runsError.message }, { status: 500 });
    }

    const allRuns = runs ?? [];
    const totalRuns = allRuns.length;
    const successCount = allRuns.filter((r) => r.status === 'success').length;
    const failedCount = allRuns.filter((r) => r.status === 'failed').length;
    const partialCount = allRuns.filter((r) => r.status === 'partial').length;
    const timeoutCount = allRuns.filter((r) => r.status === 'timeout').length;
    const successRate = totalRuns > 0 ? Math.round((successCount / totalRuns) * 100) : 0;

    const totalDuration = allRuns.reduce(
      (sum, r) => sum + (r.execution_duration_seconds ?? 0),
      0
    );
    const avgDurationSeconds = totalRuns > 0 ? Math.round(totalDuration / totalRuns) : 0;

    const totalCostUsd = allRuns.reduce((sum, r) => sum + (r.cost_usd ?? 0), 0);
    const totalTokensInput = allRuns.reduce((sum, r) => sum + (r.tokens_input ?? 0), 0);
    const totalTokensOutput = allRuns.reduce((sum, r) => sum + (r.tokens_output ?? 0), 0);

    // Cost breakdown per agent
    const grouped = new Map<string, { cost: number; count: number; tokens: number }>();
    for (const run of allRuns) {
      const existing = grouped.get(run.agent_name) ?? { cost: 0, count: 0, tokens: 0 };
      existing.cost += run.cost_usd ?? 0;
      existing.count += 1;
      existing.tokens += (run.tokens_input ?? 0) + (run.tokens_output ?? 0);
      grouped.set(run.agent_name, existing);
    }

    const costBreakdown = Array.from(grouped.entries())
      .map(([agent_name, { cost, count, tokens }]) => ({
        agent_name,
        total_cost: cost,
        run_count: count,
        avg_cost: count > 0 ? cost / count : 0,
        total_tokens: tokens,
      }))
      .sort((a, b) => b.total_cost - a.total_cost);

    return NextResponse.json({
      stats: {
        totalRuns,
        successCount,
        failedCount,
        partialCount,
        timeoutCount,
        successRate,
        avgDurationSeconds,
        totalCostUsd,
        totalTokensInput,
        totalTokensOutput,
      },
      costBreakdown,
      periodDays,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
