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
  LabelList,
} from 'recharts';
import { formatMarketSize } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';

interface MarketSizeChartProps {
  tam: number;
  sam: number;
  som: number;
  confidence: 'low' | 'medium' | 'high';
  assumptions?: string[];
}

const MARKET_COLORS = {
  tam: '#D97706',
  sam: '#F59E0B',
  som: '#FCD34D',
};

const CONFIDENCE_CONFIG = {
  high: { label: 'High Confidence', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  medium: { label: 'Medium Confidence', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  low: { label: 'Low Confidence', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
};

interface TooltipPayload {
  value: number;
  name: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <p className="font-bold text-slate-900">{label}</p>
      <p className="text-amber-600 font-semibold">{formatMarketSize(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

export function MarketSizeChart({
  tam,
  sam,
  som,
  confidence,
  assumptions,
}: MarketSizeChartProps) {
  const conf = CONFIDENCE_CONFIG[confidence];
  const data = [
    { name: 'TAM', value: tam, color: MARKET_COLORS.tam },
    { name: 'SAM', value: sam, color: MARKET_COLORS.sam },
    { name: 'SOM', value: som, color: MARKET_COLORS.som },
  ];

  return (
    <div className="space-y-4">
      {/* Confidence badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-600">Market Size Estimates</h3>
        <span
          className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
            conf.bg,
            conf.text,
            conf.border
          )}
        >
          {conf.label}
        </span>
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
          />
          <YAxis
            tickFormatter={(v) => formatMarketSize(v)}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={72}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v: number) => formatMarketSize(v)}
              style={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Key assumptions */}
      {assumptions && assumptions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Key Assumptions
          </p>
          <ul className="space-y-1">
            {assumptions.map((a, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
