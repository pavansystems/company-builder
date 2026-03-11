'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WatchlistVersion, WatchlistItem } from '@company-builder/types';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';
import { WatchlistHeader } from './WatchlistHeader';
import { OpportunityGrid } from './OpportunityGrid';

interface WatchlistWithItems {
  id: string;
  version_number: number;
  published_at: string;
  snapshot_data: WatchlistVersion['snapshot_data'];
  total_opportunities: number | null;
  items: WatchlistItem[];
}

interface WatchlistDashboardProps {
  initialVersion: WatchlistWithItems;
  allVersions: WatchlistVersion[];
}

export function WatchlistDashboard({
  initialVersion,
  allVersions,
}: WatchlistDashboardProps) {
  const router = useRouter();
  const [currentVersionId, setCurrentVersionId] = useState(initialVersion.id);
  const [currentData, setCurrentData] = useState(initialVersion);
  const [loading, setLoading] = useState(false);

  // Subscribe to pipeline_items changes filtered to discovery phase (phase_0)
  // to auto-refresh when new opportunities arrive
  useRealtimeSubscription('pipeline_items', {
    event: '*',
    filter: 'current_phase=eq.phase_0',
    onInsert: () => router.refresh(),
    onUpdate: () => router.refresh(),
    onDelete: () => router.refresh(),
  });

  // Subscribe to watchlist_versions for new published watchlists
  useRealtimeSubscription('watchlist_versions', {
    event: 'INSERT',
    onInsert: () => router.refresh(),
  });

  async function handleVersionChange(versionId: string) {
    if (versionId === currentVersionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/watchlist?versionId=${versionId}`);
      if (!res.ok) throw new Error('Failed to fetch version');
      const data = await res.json();
      setCurrentData(data);
      setCurrentVersionId(versionId);
    } catch {
      // Silently handle — keep current version
    } finally {
      setLoading(false);
    }
  }

  const currentVersion = allVersions.find((v) => v.id === currentVersionId);

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      <WatchlistHeader
        versions={allVersions}
        currentVersionId={currentVersionId}
        currentVersion={currentVersion}
        items={currentData.items}
        onVersionChange={handleVersionChange}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[280px] rounded-xl border border-slate-200 bg-white shimmer" />
          ))}
        </div>
      ) : (
        <OpportunityGrid
          key={currentVersionId}
          initialData={{
            id: currentData.id,
            version_number: currentData.version_number,
            published_at: currentData.published_at,
            items: currentData.items,
          }}
        />
      )}
    </div>
  );
}
