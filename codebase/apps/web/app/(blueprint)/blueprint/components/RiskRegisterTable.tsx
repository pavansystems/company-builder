'use client';

import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RiskItem } from '@company-builder/types';

interface RiskRegisterTableProps {
  risks: RiskItem[];
}

const SEVERITY_MAP = { low: 1, medium: 5, high: 8, critical: 10 };
const LIKELIHOOD_MAP = { low: 2, medium: 5, high: 8 };

function riskScore(risk: RiskItem): number {
  return SEVERITY_MAP[risk.severity] * LIKELIHOOD_MAP[risk.likelihood];
}

function ScorePill({
  value,
  type,
}: {
  value: string;
  type: 'severity' | 'likelihood' | 'score';
}) {
  const num =
    type === 'score'
      ? parseInt(value, 10)
      : type === 'severity'
      ? SEVERITY_MAP[value as keyof typeof SEVERITY_MAP]
      : LIKELIHOOD_MAP[value as keyof typeof LIKELIHOOD_MAP];

  const colorClass =
    num >= 49
      ? 'bg-red-100 text-red-700 border-red-200'
      : num >= 25
      ? 'bg-amber-100 text-amber-700 border-amber-200'
      : num >= 8
      ? 'bg-orange-50 text-orange-600 border-orange-200'
      : 'bg-green-50 text-green-700 border-green-200';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border tabular-nums capitalize',
        colorClass
      )}
    >
      {type === 'score' ? value : value}
    </span>
  );
}

type SortDir = 'asc' | 'desc' | null;
type SortKey = 'severity' | 'likelihood' | 'score';

export function RiskRegisterTable({ risks }: RiskRegisterTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('desc');
      }
    },
    [sortKey]
  );

  const sorted = [...risks].sort((a, b) => {
    if (!sortDir) return 0;
    let aVal: number, bVal: number;
    if (sortKey === 'severity') {
      aVal = SEVERITY_MAP[a.severity];
      bVal = SEVERITY_MAP[b.severity];
    } else if (sortKey === 'likelihood') {
      aVal = LIKELIHOOD_MAP[a.likelihood];
      bVal = LIKELIHOOD_MAP[b.likelihood];
    } else {
      aVal = riskScore(a);
      bVal = riskScore(b);
    }
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  function SortIcon({ sortFor }: { sortFor: SortKey }) {
    if (sortKey !== sortFor) return <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />;
    if (sortDir === 'asc') return <ChevronUp className="h-3.5 w-3.5 text-slate-700" />;
    if (sortDir === 'desc') return <ChevronDown className="h-3.5 w-3.5 text-slate-700" />;
    return <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />;
  }

  function exportCSV() {
    const header = 'Category,Description,Severity,Likelihood,Risk Score,Mitigation,Monitoring Trigger';
    const rows = risks.map((r) =>
      [
        r.category,
        `"${r.description.replace(/"/g, '""')}"`,
        r.severity,
        r.likelihood,
        riskScore(r),
        `"${r.mitigation.replace(/"/g, '""')}"`,
        `"${r.monitoring_trigger.replace(/"/g, '""')}"`,
      ].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'risk-register.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={exportCSV}
          className="gap-2 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Category
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Risk
              </th>
              <th
                className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-800"
                onClick={() => handleSort('severity')}
              >
                <div className="flex items-center justify-center gap-1">
                  Severity <SortIcon sortFor="severity" />
                </div>
              </th>
              <th
                className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-800"
                onClick={() => handleSort('likelihood')}
              >
                <div className="flex items-center justify-center gap-1">
                  Likelihood <SortIcon sortFor="likelihood" />
                </div>
              </th>
              <th
                className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-800"
                onClick={() => handleSort('score')}
              >
                <div className="flex items-center justify-center gap-1">
                  Score <SortIcon sortFor="score" />
                </div>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mitigation
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((risk, i) => {
              const score = riskScore(risk);
              const isExpanded = expandedIdx === i;

              return (
                <React.Fragment key={i}>
                  <tr
                    className="hover:bg-slate-50/60 cursor-pointer"
                    onClick={() => setExpandedIdx(isExpanded ? null : i)}
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                        {risk.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium max-w-[200px]">
                      <div className="line-clamp-2">{risk.description}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScorePill value={risk.severity} type="severity" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScorePill value={risk.likelihood} type="likelihood" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScorePill value={String(score)} type="score" />
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[200px]">
                      <div className="line-clamp-2 text-xs">{risk.mitigation}</div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50/80">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                              Full Description
                            </p>
                            <p className="text-sm text-slate-700">{risk.description}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                              Mitigation Strategy
                            </p>
                            <p className="text-sm text-slate-700">{risk.mitigation}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                              Monitoring Trigger
                            </p>
                            <p className="text-sm text-slate-700">{risk.monitoring_trigger}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
