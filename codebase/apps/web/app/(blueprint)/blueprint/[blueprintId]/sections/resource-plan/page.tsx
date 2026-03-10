import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { RunwayChart } from '../../../components/RunwayChart';
import { formatCurrency } from '@/lib/utils/formatters';
import { Calendar, DollarSign, Users } from 'lucide-react';
import type { HiringPlanEntry, FundingMilestone, Blueprint } from '@company-builder/types';

interface PageProps {
  params: Promise<{ blueprintId: string }>;
}

export default async function ResourcePlanPage({ params }: PageProps) {
  const { blueprintId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: blueprintRaw } = await supabase
    .from('blueprints')
    .select('*')
    .eq('id', blueprintId)
    .single();

  if (!blueprintRaw) notFound();
  const blueprint = blueprintRaw as unknown as Blueprint;

  const hiringPlan = (blueprint.hiring_plan as HiringPlanEntry[]) ?? [];
  const fundingMilestones = (blueprint.funding_milestones as FundingMilestone[]) ?? [];
  const techStack = blueprint.technology_stack as Record<string, unknown> | null;

  const totalHeadcount = hiringPlan.reduce((sum, r) => sum + r.headcount, 0);
  const annualCost = hiringPlan.reduce(
    (sum, r) => sum + r.cost_per_person * r.headcount,
    0
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-100">
          <Calendar className="h-5 w-5 text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Resource Plan</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {blueprint.upfront_build_cost != null && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">Upfront Build Cost</p>
            <p className="text-xl font-black text-slate-900 tabular-nums">
              {formatCurrency(blueprint.upfront_build_cost)}
            </p>
          </div>
        )}
        {blueprint.monthly_operating_cost != null && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">Monthly Burn</p>
            <p className="text-xl font-black text-slate-900 tabular-nums">
              {formatCurrency(blueprint.monthly_operating_cost)}
            </p>
          </div>
        )}
        {blueprint.runway_months != null && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-xs text-emerald-600 mb-1">Runway</p>
            <p className="text-xl font-black text-emerald-700">
              {blueprint.runway_months} months
            </p>
          </div>
        )}
        {totalHeadcount > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">Total Headcount</p>
            <p className="text-xl font-black text-slate-900">{totalHeadcount} FTE</p>
          </div>
        )}
      </div>

      {/* Runway chart */}
      {hiringPlan.length > 0 && blueprint.runway_months != null && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Runway Projection
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <RunwayChart
              hiringPlan={hiringPlan}
              burnRateMonthly={blueprint.monthly_operating_cost ?? 10000}
              totalFundingNeeded={
                blueprint.upfront_build_cost
                  ? blueprint.upfront_build_cost +
                    (blueprint.monthly_operating_cost ?? 0) * blueprint.runway_months
                  : (blueprint.monthly_operating_cost ?? 0) * blueprint.runway_months
              }
              runwayMonths={blueprint.runway_months}
            />
          </div>
        </div>
      )}

      {/* Hiring plan */}
      {hiringPlan.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4" />
            Hiring Plan
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Start Month
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Headcount
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Cost / Person
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Annual
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hiringPlan.map((entry, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{entry.role}</td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      Month {entry.start_month}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-slate-700">
                      {entry.headcount}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                      {formatCurrency(entry.cost_per_person)}/yr
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800 tabular-nums">
                      {formatCurrency(entry.cost_per_person * entry.headcount)}/yr
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50/60 border-t-2 border-slate-200">
                  <td colSpan={3} className="px-4 py-3 text-xs font-bold text-slate-600">
                    Total ({totalHeadcount} FTE)
                  </td>
                  <td />
                  <td className="px-4 py-3 text-right font-bold text-slate-800 tabular-nums">
                    {formatCurrency(annualCost)}/yr
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Funding milestones */}
      {fundingMilestones.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Funding Milestones
          </h2>
          <div className="space-y-2">
            {fundingMilestones.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{m.milestone}</p>
                  <p className="text-xs text-slate-500">Month {m.month}</p>
                </div>
                <span className="font-bold text-emerald-700 tabular-nums text-sm shrink-0">
                  {formatCurrency(m.required_funding_usd)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tech stack */}
      {techStack && Object.keys(techStack).length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Technology Stack
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(techStack).map(([category, items]) => (
              <div key={category} className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-600 capitalize">{category}</p>
                {Array.isArray(items) ? (
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((item, j) => (
                      <span
                        key={j}
                        className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        {String(item)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">{String(items)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
