'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/formatters';
import type { Validation } from '@company-builder/types';

interface EconomicsTableProps {
  validation: Validation;
}

function getLtvCacColor(ratio: number | null) {
  if (ratio === null) return 'text-slate-400';
  if (ratio > 3) return 'text-green-600 bg-green-50';
  if (ratio >= 1) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">Month {label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function EconomicsTable({ validation }: EconomicsTableProps) {
  const metrics = [
    {
      label: 'Customer Acquisition Cost (CAC)',
      value: validation.cac != null ? formatCurrency(validation.cac) : '—',
      sub: null,
    },
    {
      label: 'Lifetime Value (LTV)',
      value: validation.ltv != null ? formatCurrency(validation.ltv) : '—',
      sub: null,
    },
    {
      label: 'LTV:CAC Ratio',
      value: validation.ltv_cac_ratio != null ? `${validation.ltv_cac_ratio.toFixed(1)}x` : '—',
      highlight: validation.ltv_cac_ratio,
      sub: validation.ltv_cac_ratio != null
        ? validation.ltv_cac_ratio > 3
          ? 'Excellent'
          : validation.ltv_cac_ratio >= 1
          ? 'Acceptable'
          : 'Poor'
        : null,
    },
    {
      label: 'Gross Margin',
      value: validation.gross_margin_percent != null ? `${validation.gross_margin_percent}%` : '—',
      sub: null,
    },
    {
      label: 'Breakeven (months)',
      value: validation.breakeven_months != null ? `${validation.breakeven_months}mo` : '—',
      sub: null,
    },
  ];

  // Try to build projection data from unit_economics_json if it has monthly data
  const projectionData = (() => {
    const json = validation.unit_economics_json as any;
    if (json?.monthly_projections) return json.monthly_projections;
    if (!validation.cac || !validation.ltv) return [];
    // Simple synthetic projection for 12 months
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const customers = Math.round(m * 10);
      const revenue = customers * (validation.ltv! / 24);
      const costs = customers * validation.cac! * 0.1 + 5000;
      return { month: m, revenue: Math.round(revenue), costs: Math.round(costs) };
    });
  })();

  return (
    <div className="space-y-5">
      {/* Metrics table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Metric
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {metrics.map((m) => (
              <tr key={m.label} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 text-slate-600 font-medium">{m.label}</td>
                <td className="px-4 py-3 text-right">
                  {m.highlight !== undefined ? (
                    <span
                      className={cn(
                        'inline-block px-2.5 py-1 rounded-md font-bold tabular-nums text-sm',
                        getLtvCacColor(m.highlight)
                      )}
                    >
                      {m.value}
                      {m.sub && <span className="ml-1 text-xs font-normal opacity-70">({m.sub})</span>}
                    </span>
                  ) : (
                    <span className="font-semibold text-slate-800 tabular-nums">{m.value}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Revenue projection chart */}
      {projectionData.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Revenue vs. Cost Projection (12 months)
          </h4>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `M${v}`}
                />
                <YAxis
                  tickFormatter={(v) => formatCurrency(v)}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#D97706"
                  fill="url(#revGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="costs"
                  name="Costs"
                  stroke="#ef4444"
                  fill="url(#costGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
