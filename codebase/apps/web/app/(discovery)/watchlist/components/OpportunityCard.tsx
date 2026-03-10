'use client';

import Link from 'next/link';
import {
  BarChart2,
  Globe,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import type { MarketOpportunity, OpportunityScore } from '@company-builder/types';
import { getScoreBand } from '@/lib/utils/scoreUtils';
import { cn } from '@/lib/utils';

interface OpportunityCardProps {
  opportunity: MarketOpportunity;
  score: OpportunityScore | null;
  rank: number;
}

// Rank badge styles
const RANK_STYLES: Record<number, { ring: string; badge: string; label: string }> = {
  1: {
    ring: 'ring-2 ring-yellow-400 ring-offset-2',
    badge: 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-md',
    label: '🥇',
  },
  2: {
    ring: 'ring-2 ring-slate-400 ring-offset-2',
    badge: 'bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-md',
    label: '🥈',
  },
  3: {
    ring: 'ring-2 ring-amber-600 ring-offset-2',
    badge: 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-md',
    label: '🥉',
  },
};

const READINESS_STYLES = {
  high: 'bg-green-50 text-green-700 border border-green-200',
  medium: 'bg-amber-50 text-amber-700 border border-amber-200',
  low: 'bg-red-50 text-red-700 border border-red-200',
};

const SCORE_DIMENSIONS = [
  { key: 'market_size_score', icon: Globe, label: 'Market' },
  { key: 'signal_convergence_score', icon: TrendingUp, label: 'Signals' },
  { key: 'agent_readiness_score', icon: Zap, label: 'Readiness' },
  { key: 'competitive_density_score', icon: Shield, label: 'Competition' },
  { key: 'timing_confidence_score', icon: Clock, label: 'Timing' },
] as const;

function ScoreBar({ score }: { score: number }) {
  const band = getScoreBand(score);
  const barColor =
    band === 'high' ? 'bg-green-500' : band === 'medium' ? 'bg-amber-500' : 'bg-red-500';
  const textColor =
    band === 'high' ? 'text-green-700' : band === 'medium' ? 'text-amber-700' : 'text-red-700';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className={cn('text-sm font-bold tabular-nums w-8 text-right', textColor)}>
        {Math.round(score)}
      </span>
    </div>
  );
}

export function OpportunityCard({ opportunity, score, rank }: OpportunityCardProps) {
  const compositeScore = score?.composite_score ?? 0;
  const scoreBand = getScoreBand(compositeScore);
  const rankStyle = RANK_STYLES[rank];
  const readinessTag = opportunity.agent_readiness_tag;
  const canAdvance = compositeScore >= 70;

  return (
    <div
      className={cn(
        'relative rounded-xl border border-slate-200 bg-white overflow-hidden',
        'transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
        rankStyle?.ring
      )}
    >
      {/* Teal left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 rounded-l-xl" />

      {/* Rank badge */}
      <div className="absolute top-3 right-3 z-10">
        {rank <= 3 ? (
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-black',
              rankStyle?.badge
            )}
          >
            {rank}
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
            {rank}
          </div>
        )}
      </div>

      <div className="pl-4 pr-4 pt-4 pb-4">
        {/* Category chip + title */}
        <div className="pr-8 mb-3">
          {opportunity.target_industry && (
            <span className="inline-block text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full mb-1.5">
              {opportunity.target_industry}
            </span>
          )}
          <h3 className="text-base font-bold text-slate-900 leading-tight line-clamp-2">
            {opportunity.title}
          </h3>
        </div>

        {/* Composite score bar */}
        {score && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Composite Score
              </span>
            </div>
            <ScoreBar score={compositeScore} />
          </div>
        )}

        {/* 5 dimension mini-scores */}
        {score && (
          <div className="grid grid-cols-5 gap-1 mb-3">
            {SCORE_DIMENSIONS.map(({ key, icon: Icon, label }) => {
              const dimScore = score[key] ?? 0;
              const band = getScoreBand(dimScore);
              const textColor =
                band === 'high'
                  ? 'text-green-600'
                  : band === 'medium'
                  ? 'text-amber-600'
                  : 'text-red-500';

              return (
                <div
                  key={key}
                  className="flex flex-col items-center bg-slate-50 rounded-lg p-1.5 gap-0.5"
                  title={label}
                >
                  <Icon className="h-3 w-3 text-slate-400" />
                  <span className={cn('text-xs font-bold tabular-nums', textColor)}>
                    {Math.round(dimScore)}
                  </span>
                  <span className="text-[9px] text-slate-400 leading-none">{label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Agent readiness tag */}
        {readinessTag && (
          <div className="mb-3">
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                READINESS_STYLES[readinessTag]
              )}
            >
              <Zap className="h-2.5 w-2.5" />
              {readinessTag.charAt(0).toUpperCase() + readinessTag.slice(1)} Readiness
            </span>
          </div>
        )}

        {/* Footer: View details + advance button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Link
            href={`/watchlist/${opportunity.id}`}
            className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            View Details
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>

          {canAdvance && (
            <AdvanceButton opportunityId={opportunity.id} />
          )}
        </div>
      </div>
    </div>
  );
}

// Client-side button for advancing
function AdvanceButton({ opportunityId }: { opportunityId: string }) {
  return (
    <button
      onClick={async (e) => {
        e.preventDefault();
        try {
          await fetch('/api/pipeline/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              item_type: 'opportunity',
              market_opportunity_id: opportunityId,
              current_phase: 'phase_1',
              status: 'pending',
            }),
          });
        } catch {
          // Handle silently
        }
      }}
      className="flex items-center gap-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 px-2.5 py-1 rounded-lg transition-colors"
    >
      <ArrowRight className="h-3 w-3" />
      Advance
    </button>
  );
}
