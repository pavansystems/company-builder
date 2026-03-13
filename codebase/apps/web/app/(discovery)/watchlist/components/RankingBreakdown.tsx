'use client';

import type { OpportunityScore } from '@company-builder/types';
import { ScoreRadar } from '@/components/shared/ScoreRadar';
import { getScoreBand, normalizeScore } from '@/lib/utils/scoreUtils';
import { cn } from '@/lib/utils';

interface RankingBreakdownProps {
  score: OpportunityScore;
}

const DIMENSIONS = [
  {
    key: 'market_size_score' as keyof OpportunityScore,
    weightKey: 'weight_market_size' as keyof OpportunityScore,
    label: 'Market Size',
    description: 'Total addressable market opportunity',
  },
  {
    key: 'signal_convergence_score' as keyof OpportunityScore,
    weightKey: 'weight_signal_convergence' as keyof OpportunityScore,
    label: 'Signal Convergence',
    description: 'Strength and alignment of market signals',
  },
  {
    key: 'agent_readiness_score' as keyof OpportunityScore,
    weightKey: 'weight_agent_readiness' as keyof OpportunityScore,
    label: 'Agent Readiness',
    description: 'Suitability for AI-driven execution',
  },
  {
    key: 'competitive_density_score' as keyof OpportunityScore,
    weightKey: 'weight_competitive_density' as keyof OpportunityScore,
    label: 'Competitive Density',
    description: 'White space and differentiation potential',
  },
  {
    key: 'timing_confidence_score' as keyof OpportunityScore,
    weightKey: 'weight_timing_confidence' as keyof OpportunityScore,
    label: 'Timing Confidence',
    description: 'Market timing and window of opportunity',
  },
] as const;

function ScoreBar({ score }: { score: number }) {
  const band = getScoreBand(score);
  const barColor =
    band === 'high' ? 'bg-green-500' : band === 'medium' ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', barColor)}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

export function RankingBreakdown({ score }: RankingBreakdownProps) {
  const radarData = DIMENSIONS.map((d) => ({
    dimension: d.label.split(' ')[0] ?? d.label, // Short label for radar
    score: Math.round(normalizeScore((score[d.key] as number) ?? 0)),
  }));

  const compositeScore = normalizeScore(score.composite_score ?? 0);
  const compositeBand = getScoreBand(compositeScore);
  const compositeColor =
    compositeBand === 'high'
      ? 'text-green-700 bg-green-50 border-green-200'
      : compositeBand === 'medium'
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-red-700 bg-red-50 border-red-200';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radar chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Score Dimensions</h4>
          <ScoreRadar data={radarData} color="#0D9488" name="Score" />
        </div>

        {/* Score table */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Dimension Breakdown</h4>
          <div className="space-y-3">
            {DIMENSIONS.map((d) => {
              const dimScore = Math.round(normalizeScore((score[d.key] as number) ?? 0));
              const weight = Math.round(((score[d.weightKey] as number) ?? 0) * 100);
              const band = getScoreBand(dimScore);
              const scoreColor =
                band === 'high'
                  ? 'text-green-700'
                  : band === 'medium'
                  ? 'text-amber-700'
                  : 'text-red-600';

              return (
                <div key={d.key}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-xs font-semibold text-slate-700">{d.label}</span>
                      <span className="ml-1.5 text-xs text-slate-400">×{weight}%</span>
                    </div>
                    <span className={cn('text-sm font-bold tabular-nums', scoreColor)}>
                      {dimScore}
                    </span>
                  </div>
                  <ScoreBar score={dimScore} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Composite score */}
      <div className={cn('rounded-xl border px-5 py-3 flex items-center justify-between', compositeColor)}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Composite Score
          </p>
          <p className="text-sm opacity-80 mt-0.5">
            Weighted average across all 5 dimensions
          </p>
        </div>
        <div className="text-right">
          <span className="text-4xl font-black tabular-nums">{Math.round(compositeScore)}</span>
          <span className="text-sm font-medium opacity-60">/100</span>
        </div>
      </div>

      {/* Reasoning */}
      {score.reasoning && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Scoring Rationale
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">{score.reasoning}</p>
        </div>
      )}
    </div>
  );
}
