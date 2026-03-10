'use client';

import Link from 'next/link';
import { Telescope, Lightbulb, FlaskConical, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PHASES } from '@/lib/constants/phases';
import { cn } from '@/lib/utils';

export interface PhaseStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  blocked: number;
  failed: number;
}

interface PhaseCardProps {
  phase: (typeof PHASES)[number];
  stats: PhaseStats;
}

const phaseIcons = {
  discovery: Telescope,
  ideation: Lightbulb,
  validation: FlaskConical,
  blueprint: FileText,
} as const;

const phaseLinks = {
  discovery: '/watchlist',
  ideation: '/concepts',
  validation: '/validation',
  blueprint: '/blueprint',
} as const;

const statusColors = {
  pending: '#94a3b8',
  in_progress: '#3b82f6',
  completed: '#16a34a',
  blocked: '#f97316',
  failed: '#ef4444',
};

export function PhaseCard({ phase, stats }: PhaseCardProps) {
  const Icon = phaseIcons[phase.key];
  const href = phaseLinks[phase.key];

  const pieData = [
    { name: 'pending', value: stats.pending, color: statusColors.pending },
    { name: 'in_progress', value: stats.in_progress, color: statusColors.in_progress },
    { name: 'completed', value: stats.completed, color: statusColors.completed },
    { name: 'blocked', value: stats.blocked, color: statusColors.blocked },
    { name: 'failed', value: stats.failed, color: statusColors.failed },
  ].filter((d) => d.value > 0);

  const hasData = stats.total > 0;

  const statusBreakdown = [
    { key: 'pending', label: 'Pending', count: stats.pending, color: 'bg-slate-300' },
    { key: 'in_progress', label: 'Active', count: stats.in_progress, color: 'bg-blue-500' },
    { key: 'completed', label: 'Done', count: stats.completed, color: 'bg-green-500' },
    { key: 'blocked', label: 'Blocked', count: stats.blocked, color: 'bg-orange-500' },
    { key: 'failed', label: 'Failed', count: stats.failed, color: 'bg-red-500' },
  ].filter((s) => s.count > 0);

  return (
    <Link href={href} className="block group">
      <div
        className={cn(
          'rounded-xl border border-slate-200 bg-white overflow-hidden',
          'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
          'group-focus-visible:ring-2 group-focus-visible:ring-offset-2'
        )}
        style={{ '--focus-ring': phase.color } as React.CSSProperties}
      >
        {/* Colored top border */}
        <div className="h-1" style={{ backgroundColor: phase.color }} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ backgroundColor: `${phase.color}18` }}
              >
                <Icon className="h-4 w-4" style={{ color: phase.color }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Phase {phase.id}
                </p>
                <h3 className="text-sm font-bold text-slate-900">{phase.label}</h3>
              </div>
            </div>

            {/* Mini donut chart */}
            {hasData && (
              <div className="w-14 h-14 -mt-1 -mr-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={18}
                      outerRadius={26}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Large count */}
          <div className="mb-4">
            <span
              className="text-4xl font-black tabular-nums"
              style={{ color: hasData ? phase.color : '#cbd5e1' }}
            >
              {stats.total}
            </span>
            <span className="text-sm text-slate-400 ml-1.5">
              item{stats.total !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Status breakdown bar */}
          {hasData && (
            <div className="space-y-2">
              {/* Stacked bar */}
              <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
                {statusBreakdown.map((s) => (
                  <div
                    key={s.key}
                    className={cn('h-full transition-all', s.color)}
                    style={{ width: `${(s.count / stats.total) * 100}%` }}
                    title={`${s.label}: ${s.count}`}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {statusBreakdown.map((s) => (
                  <div key={s.key} className="flex items-center gap-1">
                    <div className={cn('w-1.5 h-1.5 rounded-full', s.color)} />
                    <span className="text-xs text-slate-500">
                      {s.count} {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasData && (
            <p className="text-xs text-slate-400 italic">No items yet</p>
          )}
        </div>
      </div>
    </Link>
  );
}
