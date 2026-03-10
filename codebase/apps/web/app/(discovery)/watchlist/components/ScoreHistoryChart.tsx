'use client';

import { useEffect, useState } from 'react';
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
import { formatDate } from '@/lib/utils/formatters';

interface ScoreHistoryChartProps {
  opportunityId: string;
}

interface HistoryPoint {
  version: string;
  date: string;
  score: number;
  versionNumber: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const score = payload[0]?.value ?? 0;
  const band = score >= 70 ? 'green' : score >= 40 ? 'amber' : 'red';
  const textColor =
    band === 'green' ? 'text-green-700' : band === 'amber' ? 'text-amber-700' : 'text-red-700';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-black tabular-nums ${textColor}`}>
        {Math.round(score)}
        <span className="text-xs font-normal text-slate-400">/100</span>
      </p>
    </div>
  );
}

export function ScoreHistoryChart({ opportunityId }: ScoreHistoryChartProps) {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(
          `/api/watchlist/${opportunityId}?includeHistory=true`
        );
        if (!res.ok) return;
        const data = await res.json();
        const points: HistoryPoint[] = (data.history ?? []).map(
          (item: {
            version_number: number;
            published_at: string;
            score: number;
          }) => ({
            version: `v${item.version_number}`,
            date: formatDate(item.published_at),
            score: item.score,
            versionNumber: item.version_number,
          })
        );
        setHistory(points);
      } catch {
        // Handle silently
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [opportunityId]);

  if (loading) {
    return <div className="h-48 rounded-lg shimmer" />;
  }

  if (history.length <= 1) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-sm font-semibold text-slate-500">Not enough data yet</p>
        <p className="text-xs text-slate-400 mt-1">Check back after the next scan</p>
      </div>
    );
  }

  const latest = history[history.length - 1]?.score ?? 0;
  const first = history[0]?.score ?? 0;
  const delta = latest - first;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs text-slate-500">Score trend</p>
          <p
            className={`text-sm font-bold ${
              delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-slate-500'
            }`}
          >
            {delta > 0 ? '+' : ''}
            {Math.round(delta)} pts since first scan
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Data points</p>
          <p className="text-sm font-bold text-slate-800">{history.length} scans</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          data={history}
          margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="version"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={70} stroke="#16a34a" strokeDasharray="4 3" strokeWidth={1} />
          <ReferenceLine y={40} stroke="#d97706" strokeDasharray="4 3" strokeWidth={1} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#0D9488"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#0D9488', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#0D9488', strokeWidth: 2, stroke: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>

      <p className="text-xs text-slate-400">
        Green dashed line = 70 (high), amber = 40 (medium threshold)
      </p>
    </div>
  );
}
