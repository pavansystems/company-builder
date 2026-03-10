import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { MetricTile } from '@/components/shared/MetricTile';
import { formatCurrency, formatMarketSize } from '@/lib/utils/formatters';
import { FileText, TrendingUp, DollarSign, Users, Calendar, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Blueprint } from '@company-builder/types';

interface PageProps {
  params: Promise<{ blueprintId: string }>;
}

function getLtvCacColorClass(ratio: number | null) {
  if (ratio === null) return '';
  if (ratio > 3) return 'ring-2 ring-green-200 bg-green-50/50';
  if (ratio >= 1) return 'ring-2 ring-amber-200 bg-amber-50/50';
  return 'ring-2 ring-red-200 bg-red-50/50';
}

export default async function ExecutiveSummaryPage({ params }: PageProps) {
  const { blueprintId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: blueprintRaw } = await supabase
    .from('blueprints')
    .select('*')
    .eq('id', blueprintId)
    .single();

  if (!blueprintRaw) notFound();
  const blueprint = blueprintRaw as unknown as Blueprint;

  const { data: concept } = await supabase
    .from('concepts')
    .select('id, title, summary, value_proposition, target_customer_segment')
    .eq('id', blueprint.concept_id)
    .single();

  const { data: validation } = await supabase
    .from('validations')
    .select('tam_estimate, cac, ltv, ltv_cac_ratio')
    .eq('concept_id', blueprint.concept_id)
    .order('validated_at', { ascending: false })
    .limit(1)
    .single();

  // Compute agent:human ratio
  const agentCount = blueprint.agent_roles?.length ?? 0;
  const humanCount =
    blueprint.human_roles?.reduce((sum: number, r: any) => sum + r.headcount, 0) ?? 0;
  const ratioLabel = humanCount > 0 ? `${agentCount}:${humanCount}` : `${agentCount}:0`;

  const ltvCacRatio = validation?.ltv_cac_ratio ?? null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-100">
          <FileText className="h-5 w-5 text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Executive Summary</h1>
      </div>

      {/* Concept overview */}
      {concept && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 space-y-3">
          <h2 className="text-2xl font-black text-slate-900">{concept.title}</h2>
          {concept.summary && (
            <p className="text-slate-600 italic text-base leading-relaxed">{concept.summary}</p>
          )}
          {concept.target_customer_segment && (
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-700">Target Segment: </span>
              {concept.target_customer_segment}
            </p>
          )}
          {concept.value_proposition && (
            <p className="text-sm text-slate-700 leading-relaxed border-l-4 border-emerald-300 pl-4 bg-emerald-50/60 py-2 rounded-r-lg">
              {concept.value_proposition}
            </p>
          )}
        </div>
      )}

      {/* Key metrics grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Key Metrics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {validation?.tam_estimate && (
            <MetricTile
              label="Total Addressable Market"
              value={formatMarketSize(validation.tam_estimate)}
              icon={TrendingUp}
              color="#059669"
            />
          )}
          {validation?.cac != null && (
            <MetricTile
              label="Customer Acquisition Cost"
              value={formatCurrency(validation.cac)}
              icon={Users}
              color="#D97706"
            />
          )}
          {validation?.ltv != null && (
            <MetricTile
              label="Customer Lifetime Value"
              value={formatCurrency(validation.ltv)}
              icon={DollarSign}
              color="#059669"
            />
          )}
          {ltvCacRatio != null && (
            <MetricTile
              label="LTV:CAC Ratio"
              value={`${ltvCacRatio.toFixed(1)}x`}
              icon={TrendingUp}
              color={ltvCacRatio > 3 ? '#059669' : ltvCacRatio >= 1 ? '#D97706' : '#DC2626'}
              className={getLtvCacColorClass(ltvCacRatio)}
            />
          )}
          {blueprint.runway_months != null && (
            <MetricTile
              label="Runway"
              value={`${blueprint.runway_months} months`}
              icon={Calendar}
              color="#7C3AED"
            />
          )}
          {(agentCount > 0 || humanCount > 0) && (
            <MetricTile
              label="Agent:Human Ratio"
              value={ratioLabel}
              icon={Bot}
              color="#059669"
            />
          )}
        </div>
      </div>

      {/* Executive summary text */}
      {blueprint.executive_summary && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Investment Thesis
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-slate-800 leading-relaxed whitespace-pre-line text-base">
              {blueprint.executive_summary}
            </p>
          </div>
        </div>
      )}

      {/* Revenue model badge */}
      {blueprint.revenue_model && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Revenue Model:</span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800 capitalize">
            {blueprint.revenue_model.replace('_', ' ')}
          </span>
        </div>
      )}

      {/* Internal consistency notes */}
      {blueprint.internal_consistency_notes && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Internal Consistency Notes
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            {blueprint.internal_consistency_notes}
          </p>
        </div>
      )}
    </div>
  );
}
