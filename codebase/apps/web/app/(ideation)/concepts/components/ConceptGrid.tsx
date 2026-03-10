'use client';

import { useState, useMemo } from 'react';
import { SlidersHorizontal, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterBar } from '@/components/shared/FilterBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConceptCard, type ConceptWithScore } from './ConceptCard';
import { ConceptComparison } from './ConceptComparison';

interface ConceptGridProps {
  initialConcepts: ConceptWithScore[];
}

type SortKey = 'score' | 'date' | 'name';
type StatusFilter = 'all' | 'active' | 'selected' | 'archived';

const SORT_OPTIONS = [
  { value: 'score', label: 'Composite Score' },
  { value: 'date', label: 'Date Created' },
  { value: 'name', label: 'Name' },
];

export function ConceptGrid({ initialConcepts }: ConceptGridProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);

  // Derive unique opportunities for the filter
  const opportunityOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { label: string; value: string }[] = [];
    initialConcepts.forEach(({ concept }) => {
      if (!seen.has(concept.market_opportunity_id)) {
        seen.add(concept.market_opportunity_id);
        opts.push({
          label: concept.market_opportunity_id,
          value: concept.market_opportunity_id,
        });
      }
    });
    return opts;
  }, [initialConcepts]);

  const [opportunityFilter, setOpportunityFilter] = useState('all');

  function handleFilterChange(key: string, value: string) {
    if (key === 'search') setSearch(value);
    if (key === 'status') setStatusFilter(value as StatusFilter);
    if (key === 'opportunity') setOpportunityFilter(value);
    if (key === 'sort') setSortKey(value as SortKey);
  }

  const filtered = useMemo(() => {
    let list = [...initialConcepts];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        ({ concept }) =>
          concept.title.toLowerCase().includes(q) ||
          (concept.summary ?? '').toLowerCase().includes(q) ||
          (concept.target_customer_segment ?? '').toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(({ concept }) => {
        if (statusFilter === 'selected') return concept.selected_for_validation;
        if (statusFilter === 'archived') return !!concept.archived_at || !concept.is_active;
        if (statusFilter === 'active') return concept.is_active && !concept.selected_for_validation && !concept.archived_at;
        return true;
      });
    }

    // Opportunity filter
    if (opportunityFilter !== 'all') {
      list = list.filter(({ concept }) => concept.market_opportunity_id === opportunityFilter);
    }

    // Sort
    list.sort((a, b) => {
      if (sortKey === 'score') {
        return (b.score?.composite_score ?? 0) - (a.score?.composite_score ?? 0);
      }
      if (sortKey === 'date') {
        return new Date(b.concept.generated_at).getTime() - new Date(a.concept.generated_at).getTime();
      }
      return a.concept.title.localeCompare(b.concept.title);
    });

    return list;
  }, [initialConcepts, search, statusFilter, opportunityFilter, sortKey]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  }

  const selectedConcepts = filtered.filter(({ concept }) => selectedIds.has(concept.id));

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <FilterBar
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { label: 'Active', value: 'active' },
                { label: 'Selected', value: 'selected' },
                { label: 'Archived', value: 'archived' },
              ],
            },
            {
              key: 'opportunity',
              label: 'Opportunity',
              options: opportunityOptions,
            },
            {
              key: 'sort',
              label: 'Sort By',
              options: SORT_OPTIONS,
            },
          ]}
          onChange={handleFilterChange}
          currentValues={{
            search,
            status: statusFilter,
            opportunity: opportunityFilter,
            sort: sortKey,
          }}
          searchPlaceholder="Search concepts..."
          className="flex-1 min-w-0"
        />

        {/* Compare button */}
        {selectedIds.size >= 2 && (
          <Button
            onClick={() => setShowComparison(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shrink-0"
            size="sm"
          >
            <GitCompare className="h-4 w-4" />
            Compare Selected ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Selection hint */}
      {selectedIds.size === 1 && (
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-violet-400" />
          Select 1–3 more concepts to enable comparison (max 4).
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No concepts found"
          description="Try adjusting your filters or search term."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(({ concept, score }) => (
            <ConceptCard
              key={concept.id}
              concept={concept}
              score={score}
              isSelected={selectedIds.has(concept.id)}
              onToggleSelect={() => toggleSelect(concept.id)}
            />
          ))}
        </div>
      )}

      {/* Comparison overlay */}
      {showComparison && selectedConcepts.length >= 2 && (
        <ConceptComparison
          concepts={selectedConcepts}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}
