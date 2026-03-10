'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import type { MarketOpportunity } from '@company-builder/types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  opportunities: MarketOpportunity[];
  onFilter: (filtered: MarketOpportunity[]) => void;
  onMinScoreChange?: (score: number) => void;
}

type ReadinessLevel = 'high' | 'medium' | 'low';

interface Filters {
  search: string;
  industry: string;
  readiness: ReadinessLevel[];
  minScore: number;
}

const READINESS_OPTIONS: { value: ReadinessLevel; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'text-green-700 bg-green-50 border-green-200' },
  { value: 'medium', label: 'Medium', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'low', label: 'Low', color: 'text-red-700 bg-red-50 border-red-200' },
];

export function FilterPanel({
  opportunities,
  onFilter,
  onMinScoreChange,
}: FilterPanelProps) {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    industry: 'all',
    readiness: [],
    minScore: 0,
  });

  const uniqueIndustries = Array.from(
    new Set(
      opportunities
        .map((o) => o.target_industry)
        .filter((i): i is string => Boolean(i))
    )
  ).sort();

  const applyFilters = useCallback(
    (f: Filters) => {
      let result = [...opportunities];

      if (f.search.trim()) {
        const q = f.search.toLowerCase();
        result = result.filter(
          (o) =>
            o.title.toLowerCase().includes(q) ||
            o.description?.toLowerCase().includes(q) ||
            o.target_industry?.toLowerCase().includes(q)
        );
      }

      if (f.industry && f.industry !== 'all') {
        result = result.filter((o) => o.target_industry === f.industry);
      }

      if (f.readiness.length > 0) {
        result = result.filter(
          (o) =>
            o.agent_readiness_tag &&
            f.readiness.includes(o.agent_readiness_tag as ReadinessLevel)
        );
      }

      onFilter(result);
      onMinScoreChange?.(f.minScore);
    },
    [opportunities, onFilter, onMinScoreChange]
  );

  useEffect(() => {
    applyFilters(filters);
  }, [filters, applyFilters]);

  const hasActiveFilters =
    filters.search !== '' ||
    (filters.industry !== '' && filters.industry !== 'all') ||
    filters.readiness.length > 0 ||
    filters.minScore > 0;

  function toggleReadiness(value: ReadinessLevel) {
    setFilters((prev) => ({
      ...prev,
      readiness: prev.readiness.includes(value)
        ? prev.readiness.filter((r) => r !== value)
        : [...prev.readiness, value],
    }));
  }

  function clearFilters() {
    setFilters({ search: '', industry: 'all', readiness: [], minScore: 0 });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search opportunities…"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="pl-8 h-8 text-sm border-slate-200 focus:border-teal-400 focus:ring-teal-100"
          />
        </div>

        {/* Industry */}
        <Select
          value={filters.industry}
          onValueChange={(v) => setFilters((prev) => ({ ...prev, industry: v }))}
        >
          <SelectTrigger className="h-8 text-sm w-44 border-slate-200">
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {uniqueIndustries.map((ind) => (
              <SelectItem key={ind} value={ind}>
                {ind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Agent readiness toggle pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 font-medium">Readiness:</span>
          {READINESS_OPTIONS.map((opt) => {
            const active = filters.readiness.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggleReadiness(opt.value)}
                className={cn(
                  'text-xs font-semibold px-2 py-1 rounded-full border transition-all',
                  active
                    ? opt.color
                    : 'text-slate-400 bg-white border-slate-200 hover:border-slate-300'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Min score slider */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Min score:{' '}
            <span className="text-slate-800 font-bold">{filters.minScore}</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.minScore}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, minScore: Number(e.target.value) }))
            }
            className="w-20 h-1 accent-teal-600 cursor-pointer"
          />
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
