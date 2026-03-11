'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartCard } from '@/components/shared/ChartCard';

interface CostBreakdownItem {
  agent_name: string;
  total_cost: number;
  run_count: number;
  avg_cost: number;
  total_tokens: number;
}

interface CostBreakdownChartProps {
  data: CostBreakdownItem[];
  periodDays: number;
}

const BAR_COLORS = [
  '#0D9488',
  '#7C3AED',
  '#D97706',
  '#059669',
  '#DC2626',
  '#2563EB',
  '#DB2777',
  '#4F46E5',
  '#0891B2',
  '#CA8A04',
];

function formatAgentLabel(name: string): string {
  return name
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CostBreakdownItem }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]!.payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-md text-sm">
      <p className="font-semibold text-slate-900 mb-1">{formatAgentLabel(item.agent_name)}</p>
      <div className="space-y-0.5 text-slate-600">
        <p>Cost: <span className="font-medium">${item.total_cost.toFixed(2)}</span></p>
        <p>Runs: <span className="font-medium">{item.run_count}</span></p>
        <p>Avg: <span className="font-medium">${item.avg_cost.toFixed(4)}</span>/run</p>
        <p>Tokens: <span className="font-medium">{item.total_tokens.toLocaleString()}</span></p>
      </div>
    </div>
  );
}

export function CostBreakdownChart({ data, periodDays }: CostBreakdownChartProps) {
  const chartData = data.slice(0, 10).map((item) => ({
    ...item,
    label: item.agent_name.length > 16
      ? item.agent_name.slice(0, 14) + '...'
      : item.agent_name,
  }));

  return (
    <ChartCard
      title="Cost by Agent"
      subtitle={`Top agents by cost in the last ${periodDays} days`}
    >
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-sm text-slate-400">
          No cost data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              tickFormatter={(v: number) => `$${v.toFixed(2)}`}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={130}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total_cost" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={BAR_COLORS[index % BAR_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
