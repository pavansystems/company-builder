import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate } from '@/lib/utils/formatters';
import { FlaskConical, ChevronRight, CheckCircle, Clock, XCircle } from 'lucide-react';
import { ValidationRealtimeRefresh } from './components/ValidationRealtimeRefresh';

export const metadata = { title: 'Validation | Company Builder' };

function VerdictBadge({ verdict }: { verdict: string | null }) {
  if (!verdict) return <span className="text-slate-400 text-xs">Pending</span>;
  if (verdict === 'go') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <CheckCircle className="h-3 w-3" /> Go
      </span>
    );
  }
  if (verdict === 'no_go') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <XCircle className="h-3 w-3" /> No Go
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <Clock className="h-3 w-3" /> {verdict.replace('_', ' ')}
    </span>
  );
}

function ProgressBar({ phase }: { phase: string | null }) {
  const PHASES = ['market_sizing', 'competitive', 'customer', 'feasibility', 'economics', 'synthesis'];
  const idx = phase ? PHASES.indexOf(phase) : -1;
  const pct = idx >= 0 ? ((idx + 1) / PHASES.length) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{phase ? phase.replace('_', ' ') : 'Not started'}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-amber-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function ValidationPage() {
  const supabase = await createServerSupabaseClient();

  const { data: concepts } = await supabase
    .from('concepts')
    .select('id, title, summary, target_customer_segment, generated_at')
    .eq('selected_for_validation', true)
    .order('generated_at', { ascending: false });

  const conceptIds = (concepts ?? []).map((c) => c.id);

  let validations: any[] = [];
  if (conceptIds.length > 0) {
    const { data } = await supabase
      .from('validations')
      .select('id, concept_id, validation_phase, verdict, confidence, validated_at')
      .in('concept_id', conceptIds);
    validations = data ?? [];
  }

  const validationMap = new Map(validations.map((v) => [v.concept_id, v]));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Realtime subscription — refreshes on agent_runs / gate_decisions changes */}
      <ValidationRealtimeRefresh />

      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100">
          <FlaskConical className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Validation Dashboard</h1>
          <p className="text-sm text-slate-500">
            Track AI-powered validation for concepts advancing to blueprint.
          </p>
        </div>
        <span className="ml-auto inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
          {(concepts ?? []).length} in validation
        </span>
      </div>

      {(concepts ?? []).length === 0 ? (
        <EmptyState
          title="No concepts in validation"
          description="Approve a concept from the Concepts page to begin validation."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(concepts ?? []).map((concept) => {
            const validation = validationMap.get(concept.id);
            return (
              <Link
                key={concept.id}
                href={`/validation/${concept.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-amber-300 transition-all duration-200 space-y-4 block"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2">
                      {concept.title}
                    </h3>
                    {concept.summary && (
                      <p className="text-xs text-slate-500 italic mt-0.5 line-clamp-2">
                        {concept.summary}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-amber-500 shrink-0 mt-0.5 transition-colors" />
                </div>

                {/* Progress */}
                <ProgressBar phase={validation?.validation_phase ?? null} />

                <div className="flex items-center justify-between">
                  <VerdictBadge verdict={validation?.verdict ?? null} />
                  {validation?.validated_at && (
                    <span className="text-xs text-slate-400">
                      {formatDate(validation.validated_at)}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
