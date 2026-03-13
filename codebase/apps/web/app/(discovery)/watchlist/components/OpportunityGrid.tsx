'use client';

import { useEffect, useState, useCallback } from 'react';
import { LayoutGrid } from 'lucide-react';
import type { MarketOpportunity, WatchlistItem } from '@company-builder/types';
import { normalizeScore } from '@/lib/utils/scoreUtils';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { EmptyState } from '@/components/shared/EmptyState';
import { OpportunityCard } from './OpportunityCard';
import { FilterPanel } from './FilterPanel';

interface WatchlistWithItems {
  id: string;
  version_number: number;
  published_at: string;
  items: WatchlistItem[];
}

interface OpportunityGridProps {
  initialData: WatchlistWithItems;
}

export function OpportunityGrid({ initialData }: OpportunityGridProps) {
  const [items, setItems] = useState<WatchlistItem[]>(initialData.items);
  const [filteredIds, setFilteredIds] = useState<Set<string>>(
    new Set(initialData.items.map((i) => i.opportunity.id))
  );
  const [minScore, setMinScore] = useState(0);

  const allOpportunities = items.map((i) => i.opportunity);

  // Real-time subscription to market_opportunities changes
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const channel = supabase
      .channel('market_opportunities_watchlist')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'market_opportunities' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as MarketOpportunity;
            setItems((prev) =>
              prev.map((item) =>
                item.opportunity.id === updated.id
                  ? { ...item, opportunity: updated }
                  : item
              )
            );
          } else if (payload.eventType === 'INSERT') {
            const newOpp = payload.new as MarketOpportunity;
            setItems((prev) => [
              ...prev,
              { opportunity: newOpp, score: null, rank: prev.length + 1 },
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleFilter = useCallback((filtered: MarketOpportunity[]) => {
    setFilteredIds(new Set(filtered.map((o) => o.id)));
  }, []);

  const handleMinScoreChange = useCallback((score: number) => {
    setMinScore(score);
  }, []);

  // Build display items respecting all filters, sorted by rank
  const displayItems = items
    .filter((item) => {
      if (!filteredIds.has(item.opportunity.id)) return false;
      if (minScore > 0 && normalizeScore(item.score?.composite_score ?? 0) < minScore) return false;
      return true;
    })
    .sort((a, b) => a.rank - b.rank);

  return (
    <div className="space-y-5">
      <FilterPanel
        opportunities={allOpportunities}
        onFilter={handleFilter}
        onMinScoreChange={handleMinScoreChange}
      />

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-800">{displayItems.length}</span>{' '}
          opportunit{displayItems.length !== 1 ? 'ies' : 'y'} found
        </p>
        <p className="text-xs text-slate-400">Sorted by rank</p>
      </div>

      {/* Card grid — 3 columns desktop */}
      {displayItems.length === 0 ? (
        <EmptyState
          title="No opportunities match your filters"
          description="Try adjusting your search, industry, readiness filters, or minimum score."
          icon={LayoutGrid}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayItems.map((item) => (
            <OpportunityCard
              key={item.opportunity.id}
              opportunity={item.opportunity}
              score={item.score}
              rank={item.rank}
            />
          ))}
        </div>
      )}
    </div>
  );
}
