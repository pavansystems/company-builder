import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SynthesisVerdict } from '../components/SynthesisVerdict';
import { ValidationProgress, type ValidationPhaseStatus } from '../components/ValidationProgress';
import { MarketSizeChart } from '../components/MarketSizeChart';
import { CompetitorTable } from '../components/CompetitorTable';
import { VulnerabilityMap } from '../components/VulnerabilityMap';
import { EconomicsTable } from '../components/EconomicsTable';
import { CustomerValidationCard } from '../components/CustomerValidationCard';
import { FeasibilityRiskMatrix } from '../components/FeasibilityRiskMatrix';
import { formatDate } from '@/lib/utils/formatters';
import type { ValidationPhase, Validation } from '@company-builder/types';
import { ArrowLeft, ChevronRight, FlaskConical } from 'lucide-react';

interface PageProps {
  params: Promise<{ conceptId: string }>;
}

const VALIDATION_PHASE_ORDER: ValidationPhase[] = [
  'market_sizing',
  'competitive',
  'customer',
  'feasibility',
  'economics',
  'synthesis',
];

function getPhaseStatuses(currentPhase: ValidationPhase | null, verdict: string | null): ValidationPhaseStatus[] {
  return VALIDATION_PHASE_ORDER.map((phase) => {
    if (!currentPhase) return { phase, status: 'pending' };

    const currentIdx = VALIDATION_PHASE_ORDER.indexOf(currentPhase);
    const phaseIdx = VALIDATION_PHASE_ORDER.indexOf(phase);

    if (phaseIdx < currentIdx) return { phase, status: 'completed' };
    if (phaseIdx === currentIdx) {
      if (verdict) return { phase, status: 'completed' };
      return { phase, status: 'in_progress' };
    }
    return { phase, status: 'pending' };
  });
}

export default async function ValidationDetailPage({ params }: PageProps) {
  const { conceptId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: concept } = await supabase
    .from('concepts')
    .select('*')
    .eq('id', conceptId)
    .single();

  if (!concept) notFound();

  const { data: validationRaw } = await supabase
    .from('validations')
    .select('*')
    .eq('concept_id', conceptId)
    .order('validated_at', { ascending: false })
    .limit(1)
    .single();

  const validation = validationRaw as unknown as Validation | null;

  const phaseStatuses = getPhaseStatuses(
    validation?.validation_phase ?? null,
    validation?.verdict ?? null
  );

  // Build risk matrix data
  const riskMatrixData = (() => {
    const risks: { title: string; likelihood: number; severity: number; category: string; mitigation?: string }[] = [];
    if (validation?.technical_risks) {
      validation.technical_risks.forEach((r) => {
        risks.push({
          title: r.risk,
          likelihood: r.severity === 'high' ? 7 : r.severity === 'medium' ? 4 : 2,
          severity: r.severity === 'high' ? 8 : r.severity === 'medium' ? 5 : 2,
          category: 'technical',
          ...(r.known_solution != null ? { mitigation: r.known_solution } : {}),
        });
      });
    }
    if (validation?.risks) {
      validation.risks.forEach((r) => {
        risks.push({
          title: r.risk,
          likelihood: r.severity === 'high' ? 7 : r.severity === 'medium' ? 4 : 2,
          severity: r.severity === 'high' ? 8 : r.severity === 'medium' ? 5 : 2,
          category: 'market',
          ...(r.mitigation != null ? { mitigation: r.mitigation } : {}),
        });
      });
    }
    return risks;
  })();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/validation" className="hover:text-slate-800 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Validation
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-800 font-medium line-clamp-1">{concept.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100">
          <FlaskConical className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{concept.title}</h1>
          {validation?.validated_at && (
            <p className="text-sm text-slate-500">
              Last updated {formatDate(validation.validated_at)}
            </p>
          )}
        </div>
      </div>

      {/* Synthesis verdict — most prominent element */}
      {validation?.verdict && (
        <SynthesisVerdict
          verdict={validation.verdict === 'go_with_caution' ? 'conditional' : (validation.verdict as 'go' | 'no_go')}
          confidence={validation.confidence ?? 0}
          executiveSummary={validation.summary ?? ''}
          keyStrengths={(validation.key_assumptions ?? []).slice(0, 4)}
          keyRisks={(validation.risks ?? []).slice(0, 4).map((r) => r.risk ?? String(r))}
          {...(validation.verdict === 'go_with_caution' ? { conditions: (validation.key_assumptions ?? []).slice(0, 3) } : {})}
        />
      )}

      {/* Progress stepper */}
      <ValidationProgress phases={phaseStatuses} />

      {/* Market sizing */}
      {(validation?.tam_estimate != null || validation?.sam_estimate != null) && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Market Sizing</h2>
          <MarketSizeChart
            tam={validation.tam_estimate ?? 0}
            sam={validation.sam_estimate ?? 0}
            som={validation.som_estimate ?? 0}
            confidence={
              (validation.tam_confidence ?? 50) >= 70
                ? 'high'
                : (validation.tam_confidence ?? 50) >= 40
                ? 'medium'
                : 'low'
            }
            {...(validation.market_sizing_methodology ? { assumptions: [validation.market_sizing_methodology] } : {})}
          />
        </section>
      )}

      {/* Competitive analysis */}
      {validation?.competitors && validation.competitors.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Competitive Analysis</h2>
          <CompetitorTable competitors={validation.competitors} />
          {validation.vulnerability_map && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-3">Vulnerability Map</h3>
              <VulnerabilityMap vulnerabilityMap={validation.vulnerability_map} />
            </div>
          )}
        </section>
      )}

      {/* Customer validation */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Customer Validation</h2>
        <CustomerValidationCard validation={validation as any} />
      </section>

      {/* Feasibility */}
      {riskMatrixData.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Feasibility Risk Matrix</h2>
          <FeasibilityRiskMatrix risks={riskMatrixData} />
          {validation?.showstoppers && validation.showstoppers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">
                Showstoppers
              </p>
              <ul className="space-y-1">
                {validation.showstoppers.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Unit economics */}
      {(validation?.cac != null || validation?.ltv != null) && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Unit Economics</h2>
          <EconomicsTable validation={validation as any} />
        </section>
      )}
    </div>
  );
}
