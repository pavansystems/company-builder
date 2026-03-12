'use client';

import { useRouter } from 'next/navigation';
import type { PipelineItem } from '@company-builder/types';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils/formatters';

interface ActiveItemsListProps {
  items: PipelineItem[];
}

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  phase_0: { label: 'Discovery', color: '#0D9488' },
  phase_1: { label: 'Ideation', color: '#7C3AED' },
  phase_2: { label: 'Validation', color: '#D97706' },
  phase_3: { label: 'Blueprint', color: '#059669' },
};

function getTimeInStep(enteredAt: string | null): string {
  if (!enteredAt) return '—';
  const ms = Date.now() - new Date(enteredAt).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor(ms / (1000 * 60));
  return `${mins}m`;
}

function getItemName(item: PipelineItem): string {
  if (item.market_opportunity_id) {
    return `Opportunity ${item.market_opportunity_id.slice(0, 8)}`;
  }
  if (item.concept_id) {
    return `Concept ${item.concept_id.slice(0, 8)}`;
  }
  return `Item ${item.id.slice(0, 8)}`;
}

type DisplayItem = PipelineItem & { _displayName: string };

const columns: Column<DisplayItem>[] = [
  {
    key: '_displayName',
    header: 'Entity',
    sortable: true,
    render: (val) => (
      <span className="font-medium text-slate-900 truncate max-w-[200px] block">
        {String(val)}
      </span>
    ),
  },
  {
    key: 'current_phase',
    header: 'Phase',
    render: (val) => {
      const phase = PHASE_LABELS[String(val ?? '')];
      if (!phase) return <span className="text-slate-400 text-xs">—</span>;
      return (
        <Badge
          variant="outline"
          className="text-xs font-semibold border"
          style={{ color: phase.color, borderColor: `${phase.color}40` }}
        >
          {phase.label}
        </Badge>
      );
    },
  },
  {
    key: 'current_step',
    header: 'Step',
    render: (val) => (
      <span className="text-xs text-slate-600 font-mono bg-slate-50 px-1.5 py-0.5 rounded">
        {val ? String(val) : '—'}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (val) => {
      if (!val) return <span className="text-slate-400 text-xs">—</span>;
      return <StatusBadge status={val as 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked'} />;
    },
  },
  {
    key: 'entered_step_at',
    header: 'Time in Step',
    sortable: true,
    render: (val) => (
      <span className="text-xs text-slate-500 tabular-nums">
        {getTimeInStep(val as string | null)}
      </span>
    ),
  },
];

export function ActiveItemsList({ items }: ActiveItemsListProps) {
  const router = useRouter();

  const displayItems: DisplayItem[] = items.map((item) => ({
    ...item,
    _displayName: getItemName(item),
  }));

  const handleRowClick = (row: DisplayItem) => {
    const id = row.market_opportunity_id ?? row.concept_id ?? row.id;
    router.push(`/review/${row.id}`);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          Active Items
        </h2>
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full tabular-nums">
          {items.length} in progress
        </span>
      </div>
      <DataTable
        columns={columns}
        data={displayItems}
        onRowClick={handleRowClick}
        emptyTitle="No active items"
        emptyDescription="No pipeline items are currently in progress."
      />
    </section>
  );
}
