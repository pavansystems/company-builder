import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { FinancialProjectionChart } from '../../../components/FinancialProjectionChart';
import { formatCurrency } from '@/lib/utils/formatters';
import { DollarSign, CheckCircle } from 'lucide-react';
import type { PricingTier, Blueprint } from '@company-builder/types';

interface PageProps {
  params: Promise<{ blueprintId: string }>;
}

function PricingTable({ tiers }: { tiers: PricingTier[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-emerald-50/60 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tier
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Price / mo
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Target Segment
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Features
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tiers.map((tier, i) => (
            <tr key={i} className="hover:bg-slate-50/50">
              <td className="px-4 py-4">
                <div className="font-bold text-slate-900">{tier.name}</div>
              </td>
              <td className="px-4 py-4 text-right">
                <span className="text-xl font-black text-emerald-700 tabular-nums">
                  {formatCurrency(tier.price)}
                </span>
              </td>
              <td className="px-4 py-4 text-slate-600">{tier.target_segment}</td>
              <td className="px-4 py-4">
                <ul className="space-y-1">
                  {tier.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-1.5 text-xs text-slate-700">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function BusinessModelPage({ params }: PageProps) {
  const { blueprintId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: blueprintRaw } = await supabase
    .from('blueprints')
    .select('*')
    .eq('id', blueprintId)
    .single();

  if (!blueprintRaw) notFound();
  const blueprint = blueprintRaw as unknown as Blueprint;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-100">
          <DollarSign className="h-5 w-5 text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Business Model</h1>
      </div>

      {/* Revenue model */}
      {blueprint.revenue_model && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Revenue Model:</span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800 capitalize">
            {blueprint.revenue_model.replace('_', ' ')}
          </span>
        </div>
      )}

      {/* Customer journey */}
      {blueprint.customer_journey && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Customer Journey
          </h2>
          <p className="text-slate-800 leading-relaxed whitespace-pre-line">
            {blueprint.customer_journey}
          </p>
        </div>
      )}

      {/* Pricing tiers */}
      {blueprint.pricing_tiers && blueprint.pricing_tiers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Pricing Tiers
          </h2>
          <PricingTable tiers={blueprint.pricing_tiers as PricingTier[]} />
        </div>
      )}

      {/* Financial projection */}
      {blueprint.financial_projection && blueprint.financial_projection.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Financial Projection
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <FinancialProjectionChart projection={blueprint.financial_projection as any} />
          </div>
        </div>
      )}

      {/* Expansion opportunities */}
      {blueprint.expansion_revenue_opportunities && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Expansion Revenue Opportunities
          </h2>
          <pre className="text-xs text-slate-600 whitespace-pre-wrap">
            {JSON.stringify(blueprint.expansion_revenue_opportunities, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
