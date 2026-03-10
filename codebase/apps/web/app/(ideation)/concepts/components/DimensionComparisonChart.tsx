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
import type { ConceptWithScore } from './ConceptCard';

interface DimensionComparisonChartProps {
  concepts: ConceptWithScore[];
}

const DIMENSIONS = [
  { key: 'disruption_potential' as const, label: 'Disruption' },
  { key: 'agent_readiness' as const, label: 'Agent Ready' },
  { key: 'feasibility' as const, label: 'Feasibility' },
  { key: 'differentiation' as const, label: 'Differentiation' },
  { key: 'revenue_clarity' as const, label: 'Revenue' },
];

const CONCEPT_COLORS = ['#7C3AED', '#059669', '#D97706', '#2563EB'];

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-800 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600 truncate max-w-[120px]">{p.name}</span>
          <span className="font-bold text-slate-900 ml-auto pl-3">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function DimensionComparisonChart({ concepts }: DimensionComparisonChartProps) {
  const data = DIMENSIONS.map(({ key, label }) => {
    const row: Record<string, string | number> = { dimension: label };
    concepts.forEach(({ concept, score }) => {
      row[concept.title] = score?.[key] ?? 0;
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="dimension"
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(value) => (
            <span className="text-slate-600 truncate max-w-[80px] inline-block">{value}</span>
          )}
        />
        {concepts.map(({ concept }, idx) => (
          <Bar
            key={concept.id}
            dataKey={concept.title}
            fill={CONCEPT_COLORS[idx % CONCEPT_COLORS.length]}
            radius={[3, 3, 0, 0]}
            maxBarSize={32}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
