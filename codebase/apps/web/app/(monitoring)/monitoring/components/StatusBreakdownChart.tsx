'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartCard } from '@/components/shared/ChartCard';

interface StatusBreakdownChartProps {
  successCount: number;
  failedCount: number;
  partialCount: number;
  timeoutCount: number;
  periodDays: number;
}

const STATUS_COLORS: Record<string, string> = {
  Success: '#059669',
  Failed: '#DC2626',
  Partial: '#D97706',
  Timeout: '#EA580C',
};

export function StatusBreakdownChart({
  successCount,
  failedCount,
  partialCount,
  timeoutCount,
  periodDays,
}: StatusBreakdownChartProps) {
  const data = [
    { name: 'Success', value: successCount },
    { name: 'Failed', value: failedCount },
    { name: 'Partial', value: partialCount },
    { name: 'Timeout', value: timeoutCount },
  ].filter((d) => d.value > 0);

  return (
    <ChartCard
      title="Status Distribution"
      subtitle={`Run outcomes over the last ${periodDays} days`}
    >
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-sm text-slate-400">
          No run data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={STATUS_COLORS[entry.name] ?? '#94a3b8'}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [value, name]}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span className="text-xs text-slate-600">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
