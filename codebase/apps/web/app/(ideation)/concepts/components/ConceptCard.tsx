'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Concept, ConceptScore } from '@company-builder/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ScoreCard } from '@/components/shared/ScoreCard';

export interface ConceptWithScore {
  concept: Concept;
  score: ConceptScore | null;
  pipelineItemId?: string;
}

interface ConceptCardProps {
  concept: Concept;
  score: ConceptScore | null;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const MINI_DIMENSIONS = [
  { key: 'disruption_potential' as const, label: 'Disruption' },
  { key: 'agent_readiness' as const, label: 'Agent' },
  { key: 'feasibility' as const, label: 'Feasibility' },
  { key: 'differentiation' as const, label: 'Differentiation' },
  { key: 'revenue_clarity' as const, label: 'Revenue' },
] as const;

function getMiniBarColor(val: number) {
  if (val >= 70) return 'bg-green-400';
  if (val >= 40) return 'bg-amber-400';
  return 'bg-red-400';
}

function getStatusFromConcept(c: Concept): 'approved' | 'rejected' | 'pending' | 'in_progress' {
  if (c.selected_for_validation) return 'approved';
  if (c.archived_at) return 'rejected';
  if (!c.is_active) return 'rejected';
  return 'pending';
}

export function ConceptCard({ concept, score, isSelected = false, onToggleSelect }: ConceptCardProps) {
  const composite = score?.composite_score ?? 0;
  const status = getStatusFromConcept(concept);

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border bg-white transition-all duration-200',
        'hover:shadow-md hover:scale-[1.01]',
        isSelected
          ? 'border-violet-400 ring-2 ring-violet-200 shadow-md'
          : 'border-slate-200 shadow-sm',
        'overflow-hidden'
      )}
    >
      {/* Violet accent left border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 rounded-l-xl" />

      <div className="pl-4 pr-4 pt-4 pb-3 flex flex-col gap-3 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">
              {concept.title}
            </h3>
            {concept.summary && (
              <p className="text-xs text-slate-500 italic mt-0.5 line-clamp-2">
                {concept.summary}
              </p>
            )}
          </div>
          {onToggleSelect && (
            <button
              onClick={onToggleSelect}
              className={cn(
                'flex-shrink-0 w-5 h-5 rounded border-2 transition-colors mt-0.5',
                isSelected
                  ? 'bg-violet-600 border-violet-600'
                  : 'bg-white border-slate-300 hover:border-violet-400'
              )}
              aria-label={isSelected ? 'Deselect' : 'Select for comparison'}
            >
              {isSelected && (
                <svg viewBox="0 0 12 12" className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1.5 6L4.5 9L10.5 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Score section */}
        {score ? (
          <div className="flex items-center gap-3">
            <ScoreCard score={composite} label="Score" size="sm" />
            <div className="flex-1 space-y-1.5">
              {MINI_DIMENSIONS.map(({ key, label }) => {
                const val = score[key] ?? 0;
                return (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 w-[64px] shrink-0 truncate">{label}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', getMiniBarColor(val))}
                        style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 tabular-nums w-6 text-right shrink-0">
                      {Math.round(val)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic py-2">No score available</div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {concept.target_customer_segment && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-200 max-w-[140px] truncate">
              {concept.target_customer_segment}
            </span>
          )}
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-2.5">
        <Link
          href={`/concepts/${concept.id}`}
          className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
        >
          View Details &rarr;
        </Link>
      </div>
    </div>
  );
}
