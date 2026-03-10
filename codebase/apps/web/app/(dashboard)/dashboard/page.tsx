import {
  Telescope,
  Activity,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { MetricTile } from '@/components/shared/MetricTile';
import { PhaseNav } from '@/components/layout/PhaseNav';
import { PipelineOverview } from './components/PipelineOverview';
import { PipelineFunnelChart } from './components/PipelineFunnelChart';
import { RecentActivity } from './components/RecentActivity';
import { ActiveItemsList } from './components/ActiveItemsList';
import { BlockedItemsAlert } from './components/BlockedItemsAlert';
import type { PhaseStats } from './components/PhaseCard';
import type { PipelineItem, PipelineEvent } from '@company-builder/types';
import { formatCurrency } from '@/lib/utils/formatters';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const EMPTY_STATS: PhaseStats = {
  total: 0,
  pending: 0,
  in_progress: 0,
  completed: 0,
  blocked: 0,
  failed: 0,
};

function buildPhaseStats(items: PipelineItem[], phase: string): PhaseStats {
  const phaseItems = items.filter((i) => i.current_phase === phase);
  return {
    total: phaseItems.length,
    pending: phaseItems.filter((i) => i.status === 'pending').length,
    in_progress: phaseItems.filter((i) => i.status === 'in_progress').length,
    completed: phaseItems.filter((i) => i.status === 'completed').length,
    blocked: phaseItems.filter((i) => i.status === 'blocked').length,
    failed: phaseItems.filter((i) => i.status === 'failed').length,
  };
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch all pipeline items
  const { data: allItems = [] } = await supabase
    .from('pipeline_items')
    .select('*')
    .order('entered_phase_at', { ascending: false });

  const items = (allItems ?? []) as PipelineItem[];

  // Fetch recent events (last 20)
  const { data: recentEventsRaw = [] } = await supabase
    .from('pipeline_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  const recentEvents = (recentEventsRaw ?? []) as unknown as PipelineEvent[];

  // Fetch total agent run costs
  const { data: agentRunCosts = [] } = await supabase
    .from('agent_runs')
    .select('cost_usd');
  const totalCost = (agentRunCosts ?? []).reduce(
    (sum: number, r: { cost_usd: number | null }) => sum + (r.cost_usd ?? 0),
    0
  );

  // Derived stats
  const phaseStats = {
    discovery: buildPhaseStats(items, 'phase_0'),
    ideation: buildPhaseStats(items, 'phase_1'),
    validation: buildPhaseStats(items, 'phase_2'),
    blueprint: buildPhaseStats(items, 'phase_3'),
  };

  const totalIdeas = items.length;
  const activeItems = items.filter((i) => i.status === 'in_progress');
  const completedItems = items.filter((i) => i.status === 'completed');
  const blockedItems = items.filter((i) => i.status === 'blocked');
  const successRate =
    totalIdeas > 0 ? Math.round((completedItems.length / totalIdeas) * 100) : 0;

  // Funnel chart data
  const funnelData = [
    {
      phase: 'Discovery',
      entered: phaseStats.discovery.total,
      advanced: phaseStats.ideation.total,
      rejected: phaseStats.discovery.failed,
    },
    {
      phase: 'Ideation',
      entered: phaseStats.ideation.total,
      advanced: phaseStats.validation.total,
      rejected: phaseStats.ideation.failed,
    },
    {
      phase: 'Validation',
      entered: phaseStats.validation.total,
      advanced: phaseStats.blueprint.total,
      rejected: phaseStats.validation.failed,
    },
    {
      phase: 'Blueprint',
      entered: phaseStats.blueprint.total,
      advanced: phaseStats.blueprint.completed,
      rejected: phaseStats.blueprint.failed,
    },
  ];

  // Determine current phase (the phase with most active items)
  const phaseCounts = {
    discovery: phaseStats.discovery.total,
    ideation: phaseStats.ideation.total,
    validation: phaseStats.validation.total,
    blueprint: phaseStats.blueprint.total,
  };

  const currentPhaseId = (() => {
    const active = activeItems[0]?.current_phase;
    if (active === 'phase_0') return 0;
    if (active === 'phase_1') return 1;
    if (active === 'phase_2') return 2;
    if (active === 'phase_3') return 3;
    return 0;
  })() as 0 | 1 | 2 | 3;

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pipeline Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview of your AI-powered company building pipeline
        </p>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          value={totalIdeas}
          label="Total Ideas"
          icon={Telescope}
          color="#0D9488"
        />
        <MetricTile
          value={activeItems.length}
          label="Active Pipeline"
          icon={Activity}
          color="#7C3AED"
        />
        <MetricTile
          value={`${successRate}%`}
          label="Success Rate"
          icon={TrendingUp}
          color="#059669"
        />
        <MetricTile
          value={formatCurrency(totalCost)}
          label="Agent Cost"
          icon={DollarSign}
          color="#D97706"
        />
      </div>

      {/* Phase Nav + Blocked Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white px-5 py-4 overflow-x-auto">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">
            Pipeline Progress
          </p>
          <PhaseNav currentPhase={currentPhaseId} phaseCounts={phaseCounts} />
        </div>
        <BlockedItemsAlert blockedItems={blockedItems} />
      </div>

      {/* Phase Overview Cards */}
      <PipelineOverview phases={phaseStats} />

      {/* Funnel Chart + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <PipelineFunnelChart data={funnelData} />
        <div className="h-[320px]">
          <RecentActivity initialEvents={recentEvents} />
        </div>
      </div>

      {/* Active Items Table */}
      <ActiveItemsList items={activeItems} />
    </div>
  );
}
