'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, type FilterConfig } from '@/components/shared/FilterBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils/formatters';

interface ReviewItem {
  id: string;
  item_type: string | null;
  current_phase: string | null;
  status: string | null;
  last_gate_decision: string | null;
  last_gate_reason: string | null;
  entered_phase_at: string | null;
  priority: string | null;
  concept_id: string | null;
  market_opportunity_id: string | null;
  // Joined fields
  title?: string;
  composite_score?: number | null;
}

interface ReviewQueueTableProps {
  items: ReviewItem[];
}

const PHASE_LABELS: Record<string, string> = {
  phase_0: 'Phase 0: Discovery',
  phase_1: 'Phase 1: Ideation',
  phase_2: 'Phase 2: Validation',
  phase_3: 'Phase 3: Blueprint',
};

const PHASE_BADGE_VARIANT: Record<string, 'teal' | 'violet' | 'amber' | 'emerald'> = {
  phase_0: 'teal',
  phase_1: 'violet',
  phase_2: 'amber',
  phase_3: 'emerald',
};

const phaseFilters: FilterConfig[] = [
  {
    key: 'phase',
    label: 'Phase',
    options: [
      { label: 'Phase 0: Discovery', value: 'phase_0' },
      { label: 'Phase 1: Ideation', value: 'phase_1' },
      { label: 'Phase 2: Validation', value: 'phase_2' },
      { label: 'Phase 3: Blueprint', value: 'phase_3' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { label: 'Blocked', value: 'blocked' },
      { label: 'Gate Review', value: 'gate_review' },
    ],
  },
];

const columns: Column<ReviewItem>[] = [
  {
    key: 'title' as keyof ReviewItem,
    header: 'Item',
    render: (_value, row) => (
      <div>
        <p className="font-medium text-slate-900">
          {row.title || row.id.slice(0, 8)}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {row.item_type ?? 'Unknown type'}
        </p>
      </div>
    ),
  },
  {
    key: 'current_phase' as keyof ReviewItem,
    header: 'Phase',
    sortable: true,
    render: (value) => {
      const phase = value as string;
      return (
        <Badge variant={PHASE_BADGE_VARIANT[phase] ?? 'slate'}>
          {PHASE_LABELS[phase] ?? phase}
        </Badge>
      );
    },
  },
  {
    key: 'status' as keyof ReviewItem,
    header: 'Status',
    sortable: true,
    render: (value) => (
      <StatusBadge status={((value as string) ?? 'pending') as any} />
    ),
  },
  {
    key: 'composite_score' as keyof ReviewItem,
    header: 'Score',
    sortable: true,
    render: (value) => {
      const score = value as number | null;
      if (score === null || score === undefined) {
        return <span className="text-slate-400">--</span>;
      }
      const color =
        score >= 70
          ? 'text-green-600'
          : score >= 40
            ? 'text-amber-600'
            : 'text-red-600';
      return <span className={`font-semibold tabular-nums ${color}`}>{Math.round(score)}</span>;
    },
  },
  {
    key: 'entered_phase_at' as keyof ReviewItem,
    header: 'Time in Queue',
    sortable: true,
    render: (value) => {
      const ts = value as string | null;
      if (!ts) return <span className="text-slate-400">--</span>;
      return <span className="text-slate-600">{formatRelativeTime(ts)}</span>;
    },
  },
  {
    key: 'priority' as keyof ReviewItem,
    header: 'Priority',
    sortable: true,
    render: (value) => {
      const priority = value as string | null;
      const variants: Record<string, 'red' | 'amber' | 'slate'> = {
        high: 'red',
        normal: 'amber',
        low: 'slate',
      };
      return (
        <Badge variant={variants[priority ?? 'normal'] ?? 'slate'}>
          {priority ?? 'normal'}
        </Badge>
      );
    },
  },
];

export function ReviewQueueTable({ items }: ReviewQueueTableProps) {
  const router = useRouter();
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const filtered = items.filter((item) => {
    // Search filter
    const search = filterValues['search']?.toLowerCase() ?? '';
    if (search) {
      const matchText = `${item.title ?? ''} ${item.id} ${item.item_type ?? ''}`.toLowerCase();
      if (!matchText.includes(search)) return false;
    }

    // Phase filter
    const phaseFilter = filterValues['phase'];
    if (phaseFilter && phaseFilter !== 'all' && item.current_phase !== phaseFilter) {
      return false;
    }

    // Status filter
    const statusFilter = filterValues['status'];
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'gate_review') {
        if (item.last_gate_decision !== 'review' && item.status !== 'blocked') return false;
      } else if (item.status !== statusFilter) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-4">
      <FilterBar
        filters={phaseFilters}
        onChange={handleFilterChange}
        currentValues={filterValues}
        searchPlaceholder="Search review items..."
      />
      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(row) => router.push(`/review/${row.id}`)}
        emptyTitle="No items pending review"
        emptyDescription="There are no pipeline items waiting for human review at this time."
      />
    </div>
  );
}
