'use client';

import { useState } from 'react';
import { X, TrendingUp } from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ConceptWithScore } from './ConceptCard';
import { DimensionComparisonChart } from './DimensionComparisonChart';

interface ConceptComparisonProps {
  concepts: ConceptWithScore[];
  onClose: () => void;
  onAdvance?: (conceptId: string) => void;
}

const CONCEPT_COLORS = ['#7C3AED', '#059669', '#D97706', '#2563EB'];

const DIMENSIONS = [
  { key: 'disruption_potential' as const, label: 'Disruption' },
  { key: 'agent_readiness' as const, label: 'Agent Ready' },
  { key: 'feasibility' as const, label: 'Feasibility' },
  { key: 'differentiation' as const, label: 'Different.' },
  { key: 'revenue_clarity' as const, label: 'Revenue' },
];

function getScoreCellClass(val: number) {
  if (val >= 70) return 'bg-green-50 text-green-700';
  if (val >= 40) return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-700';
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

function RadarTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600 truncate max-w-[100px]">{p.name}</span>
          <span className="font-bold ml-auto pl-2">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ConceptComparison({ concepts, onClose, onAdvance }: ConceptComparisonProps) {
  const [advancing, setAdvancing] = useState<string | null>(null);

  const radarData = DIMENSIONS.map(({ key, label }) => {
    const row: Record<string, string | number> = { dimension: label };
    concepts.forEach(({ concept, score }) => {
      row[concept.title] = score?.[key] ?? 0;
    });
    return row;
  });

  async function handleAdvance(conceptId: string) {
    setAdvancing(conceptId);
    try {
      await fetch(`/api/concepts/${conceptId}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance' }),
      });
      onAdvance?.(conceptId);
    } finally {
      setAdvancing(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-4xl h-full bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-violet-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-violet-900">Concept Comparison</h2>
            <p className="text-sm text-violet-600">{concepts.length} concepts selected</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Radar overlay */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Score Profile Overlay
            </h3>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                  />
                  {concepts.map(({ concept }, idx) => (
                    <Radar
                      key={concept.id}
                      name={concept.title}
                      dataKey={concept.title}
                      stroke={CONCEPT_COLORS[idx % CONCEPT_COLORS.length]}
                      fill={CONCEPT_COLORS[idx % CONCEPT_COLORS.length]}
                      fillOpacity={0.1}
                      strokeWidth={2}
                      dot={{ r: 3, fill: CONCEPT_COLORS[idx % CONCEPT_COLORS.length], strokeWidth: 0 }}
                    />
                  ))}
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    formatter={(value) => (
                      <span className="text-slate-600 truncate max-w-[80px] inline-block">{value}</span>
                    )}
                  />
                  <Tooltip content={<RadarTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grouped bar chart */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Dimension-by-Dimension
            </h3>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <DimensionComparisonChart concepts={concepts} />
            </div>
          </div>

          {/* Dimension table */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Score Breakdown
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">
                      Dimension
                    </th>
                    {concepts.map(({ concept }, idx) => (
                      <th
                        key={concept.id}
                        className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: CONCEPT_COLORS[idx % CONCEPT_COLORS.length] }}
                      >
                        <span className="line-clamp-2 max-w-[120px] mx-auto">{concept.title}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {DIMENSIONS.map(({ key, label }) => (
                    <tr key={key} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-xs font-medium text-slate-600">{label}</td>
                      {concepts.map(({ concept, score }) => {
                        const val = score?.[key] ?? 0;
                        return (
                          <td key={concept.id} className="px-4 py-3 text-center">
                            <span
                              className={cn(
                                'inline-block px-2.5 py-1 rounded-md text-xs font-bold tabular-nums',
                                getScoreCellClass(val)
                              )}
                            >
                              {Math.round(val)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="bg-violet-50 border-t-2 border-violet-200">
                    <td className="px-4 py-3 text-xs font-bold text-violet-700">Composite</td>
                    {concepts.map(({ concept, score }) => {
                      const val = score?.composite_score ?? 0;
                      return (
                        <td key={concept.id} className="px-4 py-3 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold tabular-nums bg-violet-100 text-violet-700">
                            {Math.round(val)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Key differentiators */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Key Differentiators
            </h3>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${concepts.length}, minmax(0, 1fr))` }}
            >
              {concepts.map(({ concept }, idx) => (
                <div
                  key={concept.id}
                  className="rounded-xl border bg-white p-4 space-y-3"
                  style={{ borderColor: `${CONCEPT_COLORS[idx % CONCEPT_COLORS.length]}40` }}
                >
                  <h4
                    className="font-bold text-sm line-clamp-2"
                    style={{ color: CONCEPT_COLORS[idx % CONCEPT_COLORS.length] }}
                  >
                    {concept.title}
                  </h4>
                  {concept.summary && (
                    <p className="text-xs text-slate-600 italic line-clamp-3">{concept.summary}</p>
                  )}
                  {concept.target_customer_segment && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Target Customer
                      </p>
                      <p className="text-xs text-slate-700">{concept.target_customer_segment}</p>
                    </div>
                  )}
                  {concept.value_proposition && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Value Proposition
                      </p>
                      <p className="text-xs text-slate-700 line-clamp-3">{concept.value_proposition}</p>
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="w-full mt-2 text-xs gap-1.5"
                    style={{
                      backgroundColor: CONCEPT_COLORS[idx % CONCEPT_COLORS.length],
                    }}
                    onClick={() => handleAdvance(concept.id)}
                    disabled={advancing !== null}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    {advancing === concept.id ? 'Advancing...' : 'Advance This One'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
