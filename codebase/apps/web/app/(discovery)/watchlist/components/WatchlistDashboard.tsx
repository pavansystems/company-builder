'use client';

import { useState } from 'react';
import type { WatchlistVersion, WatchlistItem } from '@company-builder/types';
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
  const [currentVersionId, setCurrentVersionId] = useState(initialVersion.id);
  const [currentData, setCurrentData] = useState(initialVersion);
  const [loading, setLoading] = useState(false);

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
