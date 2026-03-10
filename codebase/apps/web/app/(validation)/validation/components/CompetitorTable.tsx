import type { CompetitorProfile } from '@company-builder/types';

interface CompetitorTableProps {
  competitors: CompetitorProfile[];
}

function MarketShareBar({ share }: { share: string | null }) {
  if (!share) return <span className="text-xs text-slate-400">—</span>;
  const num = parseFloat(share.replace('%', ''));
  const pct = isNaN(num) ? 0 : Math.min(100, Math.max(0, num));

  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-600 tabular-nums w-10 text-right">{share}</span>
    </div>
  );
}

export function CompetitorTable({ competitors }: CompetitorTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Name
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pricing
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Key Weaknesses
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Market Share
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {competitors.map((c, i) => (
            <tr key={i} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 font-semibold text-slate-800">{c.name}</td>
              <td className="px-4 py-3 text-slate-600">{c.pricing}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {c.weaknesses.map((w, j) => (
                    <span
                      key={j}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-100"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <MarketShareBar share={c.market_share} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
