'use client';

import type { ConceptScore } from '@company-builder/types';
import { cn } from '@/lib/utils';

interface ScoreBreakdownProps {
  score: ConceptScore;
}

const DIMENSIONS = [
  {
    key: 'disruption_potential' as const,
    label: 'Disruption Potential',
    description: 'How significantly does this concept disrupt the status quo?',
  },
  {
    key: 'agent_readiness' as const,
    label: 'Agent Readiness',
    description: 'How well-suited is this for AI agent automation?',
  },
  {
    key: 'feasibility' as const,
    label: 'Feasibility',
    description: 'How technically and operationally viable is this concept?',
  },
  {
    key: 'differentiation' as const,
    label: 'Differentiation',
    description: 'How differentiated is this from existing solutions?',
  },
  {
    key: 'revenue_clarity' as const,
    label: 'Revenue Clarity',
    description: 'How clear and compelling is the revenue model?',
  },
];

function getBarColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

export function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  const composite = score.composite_score ?? 0;

  return (
    <div className="space-y-6">
      {/* Composite score header */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-violet-50 border border-violet-200">
        <div>
          <p className="text-sm font-medium text-violet-700">Composite Score</p>
          <p className="text-xs text-violet-500 mt-0.5">Weighted average of all dimensions</p>
        </div>
        <div className="text-right">
          <span className="text-4xl font-bold text-violet-700 tabular-nums">
            {Math.round(composite)}
          </span>
          <span className="text-lg text-violet-400 ml-1">/100</span>
        </div>
      </div>

      {/* Dimension breakdown */}
      <div className="space-y-4">
        {DIMENSIONS.map(({ key, label, description }) => {
          const dimScore = score[key] ?? 0;
          const pct = Math.min(100, Math.max(0, dimScore));

          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-800">{label}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                </div>
                <span
                  className={cn(
                    'text-lg font-bold tabular-nums min-w-[3rem] text-right',
                    getScoreTextColor(dimScore)
                  )}
                >
                  {Math.round(dimScore)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', getBarColor(dimScore))}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Reasoning */}
      {score.reasoning && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Scoring Rationale
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">{score.reasoning}</p>
        </div>
      )}
    </div>
  );
}
