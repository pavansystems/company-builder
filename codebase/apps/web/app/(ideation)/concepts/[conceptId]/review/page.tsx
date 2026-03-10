import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ConceptReviewPanel } from '../../components/ConceptReviewPanel';
import { ScoreBreakdown } from '../../components/ScoreBreakdown';
import { formatDate } from '@/lib/utils/formatters';
import { ArrowLeft, ChevronRight, GitBranch } from 'lucide-react';
import type { Concept } from '@company-builder/types';

interface PageProps {
  params: Promise<{ conceptId: string }>;
}

export default async function ConceptReviewPage({ params }: PageProps) {
  const { conceptId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: conceptRaw } = await supabase
    .from('concepts')
    .select('*')
    .eq('id', conceptId)
    .single();

  if (!conceptRaw) notFound();
  const concept = conceptRaw as unknown as Concept;

  const { data: score } = await supabase
    .from('concept_scores')
    .select('*')
    .eq('concept_id', conceptId)
    .single();

  const { data: pipelineItem } = await supabase
    .from('pipeline_items')
    .select('id, status, current_phase, last_gate_decision, last_gate_at, last_gate_reason, last_gate_by')
    .eq('concept_id', conceptId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!pipelineItem) notFound();

  // Fetch gate decisions history
  const { data: gateHistory } = await supabase
    .from('gate_decisions')
    .select('*')
    .eq('pipeline_item_id', pipelineItem.id)
    .order('decided_at', { ascending: false })
    .limit(10);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/concepts" className="hover:text-slate-800 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Concepts
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/concepts/${conceptId}`}
          className="hover:text-slate-800 max-w-[180px] truncate"
        >
          {concept.title}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-800 font-medium">Gate Review</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100">
          <GitBranch className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gate Review</h1>
          <p className="text-sm text-slate-500">
            Decide whether this concept advances to the Validation phase.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: review panel (wider) */}
        <div className="lg:col-span-3 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <ConceptReviewPanel
              concept={concept}
              score={score ?? null}
              pipelineItemId={pipelineItem.id}
            />
          </div>

          {/* Gate history */}
          {gateHistory && gateHistory.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
                Previous Gate Decisions
              </h3>
              <div className="space-y-3">
                {gateHistory.map((gate) => (
                  <div
                    key={gate.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        gate.decision === 'pass' || gate.decision === 'override_pass'
                          ? 'bg-green-400'
                          : 'bg-red-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 capitalize">
                          {gate.decision.replace('_', ' ')}
                        </span>
                        {gate.gate_phase && (
                          <span className="text-xs text-slate-400">{gate.gate_phase}</span>
                        )}
                        <span className="text-xs text-slate-400 ml-auto">
                          {formatDate(gate.decided_at)}
                        </span>
                      </div>
                      {gate.decision_reason && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {gate.decision_reason}
                        </p>
                      )}
                      {gate.decision_by && (
                        <p className="text-[10px] text-slate-400 mt-0.5">by {gate.decision_by}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: score breakdown */}
        <div className="lg:col-span-2">
          {score ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 sticky top-6">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
                Score Details
              </h3>
              <ScoreBreakdown score={score} />
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-400">Score not yet available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
