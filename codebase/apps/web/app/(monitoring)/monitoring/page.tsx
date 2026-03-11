import {
  Activity,
  CheckCircle,
  DollarSign,
  Clock,
  Zap,
} from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { MetricTile } from '@/components/shared/MetricTile';
import { formatCurrency } from '@/lib/utils/formatters';
import { AgentRunsTable } from './components/AgentRunsTable';
import { CostBreakdownChart } from './components/CostBreakdownChart';
import { StatusBreakdownChart } from './components/StatusBreakdownChart';
import type { AgentRun } from '@company-builder/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatDurationLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export default async function MonitoringPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch stats for last 7 days
  const since7d = new Date();
  since7d.setDate(since7d.getDate() - 7);
  const since7dIso = since7d.toISOString();

  const { data: statsRuns = [] } = await supabase
    .from('agent_runs')
    .select('agent_name, status, execution_duration_seconds, cost_usd, tokens_input, tokens_output')
    .gte('started_at', since7dIso);

  const allStats = statsRuns ?? [];
  const totalRuns = allStats.length;
  const successCount = allStats.filter((r) => r.status === 'success').length;
  const failedCount = allStats.filter((r) => r.status === 'failed').length;
  const partialCount = allStats.filter((r) => r.status === 'partial').length;
  const timeoutCount = allStats.filter((r) => r.status === 'timeout').length;
  const successRate = totalRuns > 0 ? Math.round((successCount / totalRuns) * 100) : 0;

  const totalDuration = allStats.reduce(
    (sum, r) => sum + (r.execution_duration_seconds ?? 0),
    0
  );
  const avgDuration = totalRuns > 0 ? Math.round(totalDuration / totalRuns) : 0;
  const totalCost = allStats.reduce((sum, r) => sum + (r.cost_usd ?? 0), 0);

  // Cost breakdown per agent
  const grouped = new Map<string, { cost: number; count: number; tokens: number }>();
  for (const run of allStats) {
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

  // Fetch initial page of runs for table
  const { data: initialRunsRaw = [], count: runsCount } = await supabase
    .from('agent_runs')
    .select('*', { count: 'exact' })
    .order('started_at', { ascending: false })
    .range(0, 19);

  const initialRuns = (initialRunsRaw ?? []) as unknown as AgentRun[];

  // Get distinct agent names for filter
  const { data: agentNameRows = [] } = await supabase
    .from('agent_runs')
    .select('agent_name');

  const agentNames = [...new Set((agentNameRows ?? []).map((r) => r.agent_name))].sort();

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agent Monitoring</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor agent executions, costs, and error patterns across the pipeline
        </p>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricTile
          value={totalRuns}
          label="Total Runs (7d)"
          icon={Activity}
          color="#7C3AED"
        />
        <MetricTile
          value={`${successRate}%`}
          label="Success Rate"
          icon={CheckCircle}
          color="#059669"
        />
        <MetricTile
          value={formatDurationLabel(avgDuration)}
          label="Avg Duration"
          icon={Clock}
          color="#0D9488"
        />
        <MetricTile
          value={formatCurrency(totalCost)}
          label="Total Cost (7d)"
          icon={DollarSign}
          color="#D97706"
        />
        <MetricTile
          value={failedCount + timeoutCount}
          label="Failures (7d)"
          icon={Zap}
          color="#DC2626"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <CostBreakdownChart data={costBreakdown} periodDays={7} />
        <StatusBreakdownChart
          successCount={successCount}
          failedCount={failedCount}
          partialCount={partialCount}
          timeoutCount={timeoutCount}
          periodDays={7}
        />
      </div>

      {/* Agent Runs Table */}
      <AgentRunsTable
        initialRuns={initialRuns}
        initialTotal={runsCount ?? 0}
        agentNames={agentNames}
      />
    </div>
  );
}
