'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/formatters';
import type { FinancialProjectionMonth } from '@company-builder/types';

interface FinancialProjectionChartProps {
  projection: FinancialProjectionMonth[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const revenue = payload.find((p) => p.name === 'Revenue')?.value ?? 0;
  const costs = payload.find((p) => p.name === 'Costs')?.value ?? 0;
  const net = revenue - costs;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm space-y-1.5 min-w-[160px]">
      <p className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-2">
        Month {label}
      </p>
      <div className="flex justify-between gap-4">
        <span className="text-slate-500 text-xs">Revenue</span>
        <span className="font-semibold text-emerald-600">{formatCurrency(revenue)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-500 text-xs">Costs</span>
        <span className="font-semibold text-red-500">{formatCurrency(costs)}</span>
      </div>
      <div className="border-t border-slate-100 pt-1.5 flex justify-between gap-4">
        <span className="text-slate-500 text-xs font-semibold">Net</span>
        <span className={`font-bold text-sm ${net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {net >= 0 ? '+' : ''}{formatCurrency(net)}
        </span>
      </div>
    </div>
  );
}

export function FinancialProjectionChart({ projection }: FinancialProjectionChartProps) {
  // Find breakeven month (first month where revenue >= costs)
  const breakevenMonth = projection.find((p) => p.revenue >= p.costs)?.month ?? null;

  return (
    <div className="space-y-3">
      {breakevenMonth && (
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            Breakeven: Month {breakevenMonth}
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={projection} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `M${v}`}
          />
          <YAxis
            tickFormatter={(v) => formatCurrency(v)}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip content={<CustomTooltip />} />
          {breakevenMonth && (
            <ReferenceLine
              x={breakevenMonth}
              stroke="#059669"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{
                value: 'Breakeven',
                position: 'top',
                style: { fontSize: 10, fill: '#059669', fontWeight: 600 },
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#059669"
            fill="url(#emeraldGrad)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: '#059669' }}
          />
          <Area
            type="monotone"
            dataKey="costs"
            name="Costs"
            stroke="#ef4444"
            fill="url(#redGrad)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#ef4444' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
