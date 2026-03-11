'use client';

import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { FilterBar, type FilterConfig } from '@/components/shared/FilterBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils/formatters';
import type { AgentRun } from '@company-builder/types';

interface AgentRunsTableProps {
  initialRuns: AgentRun[];
  initialTotal: number;
  agentNames: string[];
}

const STATUS_OPTIONS = [
  { label: 'Success', value: 'success' },
  { label: 'Failed', value: 'failed' },
  { label: 'Partial', value: 'partial' },
  { label: 'Timeout', value: 'timeout' },
];

const statusVariantMap: Record<string, 'green' | 'red' | 'amber' | 'orange'> = {
  success: 'green',
  failed: 'red',
  partial: 'amber',
  timeout: 'orange',
};

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '-';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function formatTokens(count: number | null): string {
  if (count === null || count === undefined) return '-';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

function formatCostSmall(usd: number | null): string {
  if (usd === null || usd === undefined) return '-';
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

export function AgentRunsTable({ initialRuns, initialTotal, agentNames }: AgentRunsTableProps) {
  const [runs, setRuns] = useState<AgentRun[]>(initialRuns);
  const [total, setTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const limit = 20;

  const fetchRuns = useCallback(
    async (newOffset: number, newFilters: Record<string, string>) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('limit', String(limit));
        params.set('offset', String(newOffset));
        if (newFilters.status && newFilters.status !== 'all') {
          params.set('status', newFilters.status);
        }
        if (newFilters.agent_name && newFilters.agent_name !== 'all') {
          params.set('agent_name', newFilters.agent_name);
        }

        const res = await fetch(`/api/monitoring/runs?${params.toString()}`);
        const json = await res.json();
        setRuns(json.runs ?? []);
        setTotal(json.total ?? 0);
        setOffset(newOffset);
      } catch {
        // keep existing data on error
      } finally {
        setIsLoading(false);
      }
    },
    [limit]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      fetchRuns(0, newFilters);
    },
    [filters, fetchRuns]
  );

  const handlePageChange = useCallback(
    (newOffset: number) => {
      fetchRuns(newOffset, filters);
    },
    [filters, fetchRuns]
  );

  const filterConfigs: FilterConfig[] = [
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    {
      key: 'agent_name',
      label: 'Agent',
      options: agentNames.map((n) => ({ label: n, value: n })),
    },
  ];

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const columns: Column<AgentRun>[] = [
    {
      key: 'agent_name',
      header: 'Agent',
      sortable: true,
      render: (_, row) => (
        <span className="font-medium text-slate-900">{row.agent_name}</span>
      ),
    },
    {
      key: 'pipeline_item_id',
      header: 'Pipeline Item',
      render: (val) => (
        <span className="font-mono text-xs text-slate-500">
          {val ? String(val).slice(0, 8) + '...' : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (_, row) => (
        <Badge variant={statusVariantMap[row.status] ?? 'slate'}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'execution_duration_seconds',
      header: 'Duration',
      sortable: true,
      render: (_, row) => formatDuration(row.execution_duration_seconds),
    },
    {
      key: 'tokens_input',
      header: 'Tokens',
      sortable: true,
      render: (_, row) => {
        const total = (row.tokens_input ?? 0) + (row.tokens_output ?? 0);
        return formatTokens(total);
      },
    },
    {
      key: 'cost_usd',
      header: 'Cost',
      sortable: true,
      render: (_, row) => formatCostSmall(row.cost_usd),
    },
    {
      key: 'started_at',
      header: 'Started',
      sortable: true,
      render: (_, row) => (
        <span className="text-slate-500 text-xs">{formatRelativeTime(row.started_at)}</span>
      ),
    },
    {
      key: 'id',
      header: '',
      className: 'w-8',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpandedId(expandedId === row.id ? null : row.id);
          }}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          {expandedId === row.id ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Agent Runs</h2>
        <span className="text-sm text-slate-500">{total} total runs</span>
      </div>

      <FilterBar
        filters={filterConfigs}
        onChange={handleFilterChange}
        currentValues={filters}
        searchPlaceholder="Search agents..."
      />

      <DataTable
        columns={columns}
        data={runs}
        isLoading={isLoading}
        emptyTitle="No agent runs found"
        emptyDescription="No runs match the current filters."
        onRowClick={(row) => setExpandedId(expandedId === row.id ? null : row.id)}
      />

      {/* Expanded error detail row */}
      {expandedId && (() => {
        const run = runs.find((r) => r.id === expandedId);
        if (!run) return null;
        return (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 -mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-slate-700 mb-1">Run Details</p>
                <dl className="space-y-1 text-slate-600">
                  <div className="flex gap-2">
                    <dt className="text-slate-500">ID:</dt>
                    <dd className="font-mono text-xs">{run.id}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-slate-500">Version:</dt>
                    <dd>{run.agent_version ?? '-'}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-slate-500">Triggered by:</dt>
                    <dd>{run.triggered_by ?? '-'}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-slate-500">Tokens (in/out):</dt>
                    <dd>
                      {formatTokens(run.tokens_input)} / {formatTokens(run.tokens_output)}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-slate-500">Completed:</dt>
                    <dd>{run.completed_at ? formatRelativeTime(run.completed_at) : '-'}</dd>
                  </div>
                </dl>
              </div>
              {run.error_message && (
                <div>
                  <p className="font-medium text-red-700 mb-1">Error</p>
                  <pre className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 overflow-auto max-h-40 whitespace-pre-wrap">
                    {run.error_message}
                  </pre>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => handlePageChange(Math.max(0, offset - limit))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + limit >= total}
              onClick={() => handlePageChange(offset + limit)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
