import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ScoreCard } from '@/components/shared/ScoreCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ScoreRadar } from '@/components/shared/ScoreRadar';
import { ScoreBreakdown } from '../components/ScoreBreakdown';
import { formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: Promise<{ conceptId: string }>;
}

export default async function ConceptDetailPage({ params }: PageProps) {
  const { conceptId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: concept } = await supabase
    .from('concepts')
    .select('*')
    .eq('id', conceptId)
    .single();

  if (!concept) notFound();

  const { data: score } = await supabase
    .from('concept_scores')
    .select('*')
    .eq('concept_id', conceptId)
    .single();

  const { data: opportunity } = await supabase
    .from('market_opportunities')
    .select('id, title, problem_statement')
    .eq('id', concept.market_opportunity_id)
    .single();

  const { data: pipelineItem } = await supabase
    .from('pipeline_items')
    .select('id, status, current_phase, last_gate_decision')
    .eq('concept_id', conceptId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const statusDisplay = concept.selected_for_validation
    ? 'approved'
    : concept.archived_at
    ? 'rejected'
    : 'pending';

  const radarData = score
    ? [
        { dimension: 'Disruption', score: score.disruption_potential ?? 0 },
        { dimension: 'Agent Ready', score: score.agent_readiness ?? 0 },
        { dimension: 'Feasibility', score: score.feasibility ?? 0 },
        { dimension: 'Differentiation', score: score.differentiation ?? 0 },
        { dimension: 'Revenue', score: score.revenue_clarity ?? 0 },
      ]
    : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/concepts" className="hover:text-slate-800 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Concepts
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-800 font-medium line-clamp-1">{concept.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-2xl font-bold text-slate-900">{concept.title}</h1>
            <StatusBadge status={statusDisplay} />
          </div>
          {concept.summary && (
            <p className="text-slate-600 italic">{concept.summary}</p>
          )}
          <p className="text-xs text-slate-400 mt-2">
            Generated {formatDate(concept.generated_at)}
            {opportunity && (
              <>
                {' '}· Opportunity:{' '}
                <span className="text-slate-600 font-medium">{opportunity.title}</span>
              </>
            )}
          </p>
        </div>
        {pipelineItem && (
          <Link href={`/concepts/${conceptId}/review`}>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shrink-0">
              Gate Review
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: concept details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Value proposition */}
          {concept.value_proposition && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Value Proposition
              </h2>
              <p className="text-slate-800 leading-relaxed">{concept.value_proposition}</p>
            </div>
          )}

          {/* Target customer */}
          {concept.target_customer_segment && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Target Customer Segment
              </h2>
              <p className="text-slate-800">{concept.target_customer_segment}</p>
            </div>
          )}

          {/* Pain points */}
          {concept.pain_points_addressed && concept.pain_points_addressed.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Pain Points Addressed
              </h2>
              <ul className="space-y-2">
                {concept.pain_points_addressed.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                    {pt as string}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Agent architecture sketch */}
          {concept.agent_architecture_sketch && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Agent Architecture Sketch
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {concept.agent_architecture_sketch}
              </p>
            </div>
          )}

          {/* Defensibility */}
          {concept.defensibility_notes && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Defensibility
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed">{concept.defensibility_notes}</p>
            </div>
          )}

          {/* Score breakdown */}
          {score && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Score Breakdown
              </h2>
              <ScoreBreakdown score={score} />
            </div>
          )}
        </div>

        {/* Right: score card + radar */}
        <div className="space-y-5">
          {score ? (
            <>
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-5 text-center">
                <ScoreCard
                  score={score.composite_score ?? 0}
                  label="Composite Score"
                  size="lg"
                  showBand
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Score Radar
                </h3>
                <ScoreRadar data={radarData} color="#7C3AED" name={concept.title} />
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
              <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Scoring in progress</p>
            </div>
          )}

          {/* Pipeline status */}
          {pipelineItem && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Pipeline Status
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Phase</span>
                  <span className="font-medium text-slate-800">
                    {pipelineItem.current_phase ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <StatusBadge status={(pipelineItem.status ?? 'pending') as any} />
                </div>
                {pipelineItem.last_gate_decision && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Gate</span>
                    <span className="font-medium text-slate-800">
                      {pipelineItem.last_gate_decision}
                    </span>
                  </div>
                )}
              </div>
              <Link href={`/concepts/${conceptId}/review`}>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Open Gate Review
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
