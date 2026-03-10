'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/formatters';
import type { HiringPlanEntry } from '@company-builder/types';

interface RunwayChartProps {
  hiringPlan: HiringPlanEntry[];
  burnRateMonthly: number;
  totalFundingNeeded: number;
  runwayMonths: number;
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const burn = payload.find((p) => p.name === 'Cumulative Burn')?.value ?? 0;
  const headcount = payload.find((p) => p.name === 'Headcount')?.value ?? 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm min-w-[160px]">
      <p className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-2">
        Month {label}
      </p>
      <div className="flex justify-between gap-4">
        <span className="text-slate-500 text-xs">Cumulative Burn</span>
        <span className="font-bold text-red-500">{formatCurrency(burn)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-500 text-xs">Headcount</span>
        <span className="font-bold text-emerald-600">{headcount}</span>
      </div>
    </div>
  );
}

export function RunwayChart({
  hiringPlan,
  burnRateMonthly,
  totalFundingNeeded,
  runwayMonths,
}: RunwayChartProps) {
  // Build monthly data: headcount grows as people join
  const months = runwayMonths + 3; // show a bit past runway end
  const data = Array.from({ length: months }, (_, i) => {
    const m = i + 1;

    // Count headcount at this month
    const headcount = hiringPlan.reduce((sum, entry) => {
      if (entry.start_month <= m) return sum + entry.headcount;
      return sum;
    }, 0);

    // Monthly burn = base burn + hiring costs
    const hiringCost = hiringPlan.reduce((sum, entry) => {
      if (entry.start_month <= m) {
        return sum + (entry.cost_per_person * entry.headcount) / 12;
      }
      return sum;
    }, 0);

    const monthBurn = burnRateMonthly + hiringCost;

    // Cumulative burn
    const cumulativeBurn = Array.from({ length: m }, (_, j) => {
      const mj = j + 1;
      const hc = hiringPlan.reduce((s, e) => {
        if (e.start_month <= mj) return s + (e.cost_per_person * e.headcount) / 12;
        return s;
      }, 0);
      return burnRateMonthly + hc;
    }).reduce((a, b) => a + b, 0);

    return { month: m, 'Cumulative Burn': Math.round(cumulativeBurn), Headcount: headcount };
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-medium border border-red-200">
          Total Funding: {formatCurrency(totalFundingNeeded)}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
          Runway: {runwayMonths} months
        </span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="burnGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#dc2626" />
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
            yAxisId="left"
            tickFormatter={(v) => formatCurrency(v)}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={28}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Funding limit reference */}
          <ReferenceLine
            yAxisId="left"
            y={totalFundingNeeded}
            stroke="#ef4444"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{
              value: 'Funding Limit',
              position: 'insideTopRight',
              style: { fontSize: 10, fill: '#ef4444', fontWeight: 600 },
            }}
          />

          {/* Runway end reference */}
          <ReferenceLine
            xAxisId={0}
            x={runwayMonths}
            yAxisId="left"
            stroke="#059669"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={{
              value: 'Runway End',
              position: 'top',
              style: { fontSize: 10, fill: '#059669', fontWeight: 600 },
            }}
          />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="Cumulative Burn"
            stroke="#ef4444"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="right"
            type="stepAfter"
            dataKey="Headcount"
            stroke="#059669"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex gap-4 justify-center text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-red-500 inline-block rounded" />
          <span className="text-slate-500">Cumulative Burn</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-emerald-600 inline-block rounded border-dashed" />
          <span className="text-slate-500">Headcount</span>
        </div>
      </div>
    </div>
  );
}
