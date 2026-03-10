'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

interface Risk {
  title: string;
  likelihood: number;
  severity: number;
  category: string;
  mitigation?: string;
}

interface FeasibilityRiskMatrixProps {
  risks: Risk[];
}

const CATEGORY_COLORS: Record<string, string> = {
  technical: '#7C3AED',
  market: '#D97706',
  operational: '#059669',
  regulatory: '#2563EB',
  financial: '#DC2626',
  default: '#64748b',
};

function severityToNum(s: 'low' | 'medium' | 'high'): number {
  if (s === 'low') return 2;
  if (s === 'medium') return 5;
  return 8;
}
function likelihoodToNum(l: 'low' | 'medium' | 'high'): number {
  if (l === 'low') return 2;
  if (l === 'medium') return 5;
  return 8;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: Risk & { x: number; y: number } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 max-w-[240px] text-sm">
      <p className="font-bold text-slate-900 mb-1">{d.title}</p>
      <div className="flex gap-3 text-xs text-slate-500 mb-2">
        <span>Likelihood: <strong>{d.likelihood}</strong>/10</span>
        <span>Severity: <strong>{d.severity}</strong>/10</span>
      </div>
      <span
        className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize mb-2"
        style={{
          backgroundColor: `${CATEGORY_COLORS[d.category] ?? CATEGORY_COLORS.default}20`,
          color: CATEGORY_COLORS[d.category] ?? CATEGORY_COLORS.default,
        }}
      >
        {d.category}
      </span>
      {d.mitigation && (
        <p className="text-xs text-slate-600 mt-1">
          <strong>Mitigation:</strong> {d.mitigation}
        </p>
      )}
    </div>
  );
}

export function FeasibilityRiskMatrix({ risks }: FeasibilityRiskMatrixProps) {
  const plotData = risks.map((r) => ({
    ...r,
    x: r.likelihood,
    y: r.severity,
  }));

  const quadrantLabels = [
    { x: 8, y: 8.5, label: 'High Risk', color: '#DC2626' },
    { x: 1.5, y: 8.5, label: 'Monitor', color: '#D97706' },
    { x: 1.5, y: 1, label: 'Low Priority', color: '#059669' },
    { x: 8, y: 1, label: 'Manage', color: '#2563EB' },
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              type="number"
              dataKey="x"
              name="Likelihood"
              domain={[0, 10]}
              label={{
                value: 'Likelihood',
                position: 'insideBottom',
                offset: -10,
                style: { fontSize: 11, fill: '#64748b' },
              }}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Severity"
              domain={[0, 10]}
              label={{
                value: 'Severity',
                angle: -90,
                position: 'insideLeft',
                offset: 12,
                style: { fontSize: 11, fill: '#64748b' },
              }}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            {/* Quadrant dividers */}
            <ReferenceLine x={5} stroke="#e2e8f0" strokeDasharray="4 4" />
            <ReferenceLine y={5} stroke="#e2e8f0" strokeDasharray="4 4" />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={plotData} fill="#7C3AED">
              {plotData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={CATEGORY_COLORS[entry.category] ?? CATEGORY_COLORS.default}
                  fillOpacity={0.85}
                  stroke="white"
                  strokeWidth={1.5}
                  r={8}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CATEGORY_COLORS)
          .filter(([k]) => k !== 'default')
          .map(([cat, color]) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}40`,
                color,
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </span>
          ))}
      </div>
    </div>
  );
}
