'use client';

import { useState } from 'react';
import { ArrowRight, Zap, Loader2 } from 'lucide-react';
import type { MarketOpportunity, OpportunityScore, Signal } from '@company-builder/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { getScoreBand } from '@/lib/utils/scoreUtils';
import { formatMarketSize } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import { RankingBreakdown } from './RankingBreakdown';
import { SignalList } from './SignalList';
import { ScoreHistoryChart } from './ScoreHistoryChart';

interface OpportunityDetailProps {
  opportunity: MarketOpportunity;
  score: OpportunityScore | null;
  signals: Signal[];
}

const READINESS_STYLES = {
  high: 'bg-green-50 text-green-700 border border-green-200',
  medium: 'bg-amber-50 text-amber-700 border border-amber-200',
  low: 'bg-red-50 text-red-700 border border-red-200',
};

export function OpportunityDetail({ opportunity, score, signals }: OpportunityDetailProps) {
  const [advancing, setAdvancing] = useState(false);
  const [advanced, setAdvanced] = useState(false);

  const compositeScore = score?.composite_score ?? 0;
  const scoreBand = getScoreBand(compositeScore);
  const scoreColor =
    scoreBand === 'high'
      ? 'text-green-700 bg-green-50 border-green-200'
      : scoreBand === 'medium'
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-red-700 bg-red-50 border-red-200';

  const canAdvance = compositeScore >= 70 && !advanced;

  async function handleAdvance() {
    setAdvancing(true);
    try {
      await fetch('/api/pipeline/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: 'opportunity',
          market_opportunity_id: opportunity.id,
          current_phase: 'phase_1',
          status: 'pending',
        }),
      });
      setAdvanced(true);
    } catch {
      // Handle silently
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {opportunity.target_industry && (
                <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                  {opportunity.target_industry}
                </span>
              )}
              {opportunity.agent_readiness_tag && (
                <span
                  className={cn(
                    'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                    READINESS_STYLES[opportunity.agent_readiness_tag]
                  )}
                >
                  <Zap className="h-2.5 w-2.5" />
                  {opportunity.agent_readiness_tag.charAt(0).toUpperCase() +
                    opportunity.agent_readiness_tag.slice(1)}{' '}
                  Readiness
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{opportunity.title}</h1>
          </div>

          {/* Composite score */}
          {score && (
            <div
              className={cn(
                'flex flex-col items-center px-5 py-3 rounded-xl border',
                scoreColor
              )}
            >
              <span className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-0.5">
                Score
              </span>
              <span className="text-4xl font-black tabular-nums">
                {Math.round(compositeScore)}
              </span>
              <span className="text-xs opacity-60">/100</span>
            </div>
          )}
        </div>

        {/* CTA */}
        {canAdvance && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Button
              onClick={handleAdvance}
              disabled={advancing}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white"
            >
              {advancing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {advancing ? 'Advancing…' : 'Advance to Ideation'}
            </Button>
          </div>
        )}
        {advanced && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-green-700 font-semibold">
              Successfully advanced to Ideation pipeline.
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="signals">
            Signals
            {signals.length > 0 && (
              <span className="ml-1.5 text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-semibold">
                {signals.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="score">Score</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Description */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 md:col-span-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Description
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {opportunity.description ?? 'No description available.'}
              </p>
            </div>

            {/* Problem statement */}
            {opportunity.problem_statement && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Problem Statement
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {opportunity.problem_statement}
                </p>
              </div>
            )}

            {/* Market size */}
            {opportunity.market_size_estimate !== null && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Market Size Estimate
                </h3>
                <p className="text-3xl font-black text-teal-700">
                  {formatMarketSize(opportunity.market_size_estimate)}
                </p>
                {opportunity.market_size_confidence !== null && (
                  <p className="text-xs text-slate-400 mt-1">
                    {Math.round(opportunity.market_size_confidence * 100)}% confidence
                  </p>
                )}
              </div>
            )}

            {/* Target market */}
            {opportunity.target_market && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Target Market
                </h3>
                <p className="text-sm text-slate-700">{opportunity.target_market}</p>
              </div>
            )}

            {/* Competitive density */}
            {opportunity.competitive_density && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Competitive Density
                </h3>
                <p className="text-sm text-slate-700 capitalize">
                  {opportunity.competitive_density}
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Signals */}
        <TabsContent value="signals" className="mt-4">
          <SignalList signals={signals} />
        </TabsContent>

        {/* Score breakdown */}
        <TabsContent value="score" className="mt-4">
          {score ? (
            <RankingBreakdown score={score} />
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-slate-500">No scoring data available.</p>
            </div>
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="mt-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Score History</h3>
            <ScoreHistoryChart opportunityId={opportunity.id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
