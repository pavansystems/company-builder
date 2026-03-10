'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface FunnelDataPoint {
  phase: string;
  entered: number;
  advanced: number;
  rejected: number;
}

interface PipelineFunnelChartProps {
  data: FunnelDataPoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const entered = payload.find((p) => p.name === 'entered')?.value ?? 0;
  const advanced = payload.find((p) => p.name === 'advanced')?.value ?? 0;
  const conversionRate = entered > 0 ? Math.round((advanced / entered) * 100) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-[160px]">
      <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-slate-600 capitalize">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold text-slate-900 tabular-nums">{entry.value}</span>
        </div>
      ))}
      <div className="mt-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Conversion</span>
          <span
            className={`text-xs font-bold tabular-nums ${
              conversionRate >= 50
                ? 'text-green-600'
                : conversionRate >= 25
                ? 'text-amber-600'
                : 'text-red-600'
            }`}
          >
            {conversionRate}%
          </span>
        </div>
      </div>
    </div>
  );
}

const PHASE_COLORS: Record<string, string> = {
  Discovery: '#0D9488',
  Ideation: '#7C3AED',
  Validation: '#D97706',
  Blueprint: '#059669',
};

export function PipelineFunnelChart({ data }: PipelineFunnelChartProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-5">
        <h3 className="text-sm font-bold text-slate-900">Pipeline Funnel</h3>
        <p className="text-xs text-slate-500 mt-0.5">Items entered vs advanced per phase</p>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          barCategoryGap="30%"
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="phase"
            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
            iconType="circle"
            iconSize={8}
          />
          <Bar
            dataKey="entered"
            name="entered"
            fill="#0D9488"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="advanced"
            name="advanced"
            fill="#16a34a"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
