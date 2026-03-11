import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Bot,
  Scale,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ScoreCard } from '@/components/shared/ScoreCard';
import { formatRelativeTime, formatDate } from '@/lib/utils/formatters';
import { GateDecisionForm } from '../components/GateDecisionForm';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: { itemId: string };
}

const PHASE_LABELS: Record<string, string> = {
  phase_0: 'Phase 0: Discovery',
  phase_1: 'Phase 1: Ideation',
  phase_2: 'Phase 2: Validation',
  phase_3: 'Phase 3: Blueprint',
};

const NEXT_PHASE_LABELS: Record<string, string> = {
  phase_0: 'Phase 1: Ideation',
  phase_1: 'Phase 2: Validation',
  phase_2: 'Phase 3: Blueprint',
  phase_3: 'Completed',
};

const AGENT_STATUS_VARIANT: Record<string, 'green' | 'amber' | 'red' | 'slate'> = {
  success: 'green',
  partial: 'amber',
  failed: 'red',
  timeout: 'red',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return { title: `Review Item | Company Builder` };
}

export default async function ReviewDetailPage({ params }: PageProps) {
  const supabase = await createServerSupabaseClient();
  const { itemId } = params;

  // Fetch the pipeline item
  const { data: item, error: itemError } = await supabase
    .from('pipeline_items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (itemError || !item) {
    notFound();
  }

  // Fetch agent runs for this item
  const { data: agentRuns = [] } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('pipeline_item_id', itemId)
    .order('started_at', { ascending: false });

  // Fetch gate decisions for this item
  const { data: gateDecisions = [] } = await supabase
    .from('gate_decisions')
    .select('*')
    .eq('pipeline_item_id', itemId)
    .order('decided_at', { ascending: false });

  // Fetch title from related concept or opportunity
  let title: string | null = null;
  let compositeScore: number | null = null;
  let scoreDimensions: Record<string, number | null> = {};

  if (item.concept_id) {
    const { data: concept } = await supabase
      .from('concepts')
      .select('title')
      .eq('id', item.concept_id)
      .single();
    title = concept?.title ?? null;

    const { data: score } = await supabase
      .from('concept_scores')
      .select('*')
      .eq('concept_id', item.concept_id)
      .order('scored_at', { ascending: false })
      .limit(1)
      .single();

    if (score) {
      compositeScore = score.composite_score;
      scoreDimensions = {
        'Disruption Potential': score.disruption_potential,
        'Agent Readiness': score.agent_readiness,
        'Feasibility': score.feasibility,
        'Differentiation': score.differentiation,
        'Revenue Clarity': score.revenue_clarity,
      };
    }
  } else if (item.market_opportunity_id) {
    const { data: opportunity } = await supabase
      .from('market_opportunities')
      .select('title')
      .eq('id', item.market_opportunity_id)
      .single();
    title = opportunity?.title ?? null;

    const { data: score } = await supabase
      .from('opportunity_scores')
      .select('*')
      .eq('market_opportunity_id', item.market_opportunity_id)
      .order('scored_at', { ascending: false })
      .limit(1)
      .single();

    if (score) {
      compositeScore = score.composite_score;
      scoreDimensions = {
        'Market Size': score.market_size_score,
        'Signal Convergence': score.signal_convergence_score,
        'Agent Readiness': score.agent_readiness_score,
        'Competitive Density': score.competitive_density_score,
        'Timing Confidence': score.timing_confidence_score,
      };
    }
  }

  const displayTitle = title ?? `Item ${itemId.slice(0, 8)}`;
  const runs = agentRuns ?? [];
  const decisions = gateDecisions ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/review"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Review Queue
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{displayTitle}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={item.current_phase === 'phase_0' ? 'teal' : item.current_phase === 'phase_1' ? 'violet' : item.current_phase === 'phase_2' ? 'amber' : 'emerald'}>
              {PHASE_LABELS[item.current_phase ?? ''] ?? item.current_phase}
            </Badge>
            <StatusBadge status={(item.status as 'blocked' | 'pending' | 'in_progress' | 'completed' | 'failed') ?? 'pending'} />
            {item.priority && item.priority !== 'normal' && (
              <Badge variant={item.priority === 'high' ? 'red' : 'slate'}>
                {item.priority} priority
              </Badge>
            )}
          </div>
        </div>
        {item.entered_phase_at && (
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              <span>In queue {formatRelativeTime(item.entered_phase_at)}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Entered phase {formatDate(item.entered_phase_at)}
            </p>
          </div>
        )}
      </div>

      {/* Gate transition info */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-900">
              Gate Transition: {PHASE_LABELS[item.current_phase ?? ''] ?? 'Unknown'} &rarr; {NEXT_PHASE_LABELS[item.current_phase ?? ''] ?? 'Next Phase'}
            </p>
            <p className="text-sm text-orange-700 mt-1">
              This item scored in the review band and requires a human decision to advance or reject.
              {item.last_gate_reason && (
                <span className="block mt-1 italic">&ldquo;{item.last_gate_reason}&rdquo;</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      {compositeScore !== null && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Score Breakdown</h3>
          <div className="flex flex-wrap items-center gap-8">
            <ScoreCard score={compositeScore} label="Composite" size="lg" showBand />
            <div className="flex-1 min-w-[200px]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(scoreDimensions).map(([dimension, score]) => (
                  <div key={dimension}>
                    {score !== null && score !== undefined ? (
                      <ScoreCard score={score} label={dimension} size="sm" />
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-slate-400">--</p>
                        <p className="text-xs text-slate-500 mt-1">{dimension}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Run Outputs */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-5 w-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Agent Run Outputs</h3>
          <span className="text-xs text-slate-400 ml-auto">{runs.length} run{runs.length !== 1 ? 's' : ''}</span>
        </div>

        {runs.length === 0 ? (
          <p className="text-sm text-slate-500">No agent runs recorded for this item.</p>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <div key={run.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-slate-900">{run.agent_name}</span>
                    {run.agent_version && (
                      <span className="text-xs text-slate-400">v{run.agent_version}</span>
                    )}
                    <Badge variant={AGENT_STATUS_VARIANT[run.status] ?? 'slate'}>
                      {run.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-400">
                    {run.started_at ? formatRelativeTime(run.started_at) : '--'}
                  </span>
                </div>

                {run.execution_duration_seconds !== null && (
                  <p className="text-xs text-slate-500 mb-2">
                    Duration: {run.execution_duration_seconds.toFixed(1)}s
                    {run.cost_usd !== null && ` | Cost: $${run.cost_usd.toFixed(4)}`}
                    {run.tokens_input !== null && run.tokens_output !== null && (
                      <span> | Tokens: {run.tokens_input.toLocaleString()} in / {run.tokens_output.toLocaleString()} out</span>
                    )}
                  </p>
                )}

                {run.output_data && Object.keys(run.output_data).length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                      View output data
                    </summary>
                    <pre className="mt-2 text-xs text-slate-600 bg-white rounded-md border border-slate-100 p-3 overflow-x-auto max-h-60">
                      {JSON.stringify(run.output_data, null, 2)}
                    </pre>
                  </details>
                )}

                {run.error_message && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-md p-2">
                    {run.error_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Previous Gate Decisions */}
      {decisions.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="h-5 w-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">Previous Gate Decisions</h3>
          </div>
          <div className="space-y-3">
            {decisions.map((decision) => (
              <div key={decision.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        decision.decision === 'pass' || decision.decision === 'override_pass'
                          ? 'green'
                          : 'red'
                      }
                    >
                      {decision.decision}
                    </Badge>
                    {decision.gate_phase && (
                      <span className="text-xs text-slate-500">
                        at {PHASE_LABELS[decision.gate_phase] ?? decision.gate_phase}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatRelativeTime(decision.decided_at)}
                  </span>
                </div>
                {decision.decision_reason && (
                  <p className="text-sm text-slate-600 mt-1">{decision.decision_reason}</p>
                )}
                {decision.override_reason && (
                  <p className="text-sm text-amber-600 mt-1 italic">
                    Override: {decision.override_reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gate Decision Form */}
      <GateDecisionForm itemId={itemId} />
    </div>
  );
}
