'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface RadarDataItem {
  dimension: string;
  score: number;
}

interface ScoreRadarProps {
  data: RadarDataItem[];
  color?: string;
  name?: string;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2">
      <p className="text-xs font-semibold text-slate-700">{label}</p>
      <p className="text-sm font-bold text-slate-900">
        {payload[0]?.value ?? 0}
        <span className="text-xs font-normal text-slate-500">/100</span>
      </p>
    </div>
  );
}

export function ScoreRadar({
  data,
  color = '#0D9488',
  name = 'Score',
}: ScoreRadarProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#e2e8f0" strokeWidth={1} />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{
            fontSize: 11,
            fill: '#64748b',
            fontWeight: 500,
          }}
        />
        <Radar
          name={name}
          dataKey="score"
          stroke={color}
          fill={color}
          fillOpacity={0.15}
          strokeWidth={2}
          dot={{ r: 3, fill: color, strokeWidth: 0 }}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
