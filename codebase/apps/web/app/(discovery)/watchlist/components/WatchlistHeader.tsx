'use client';

import { useState } from 'react';
import { Download, ScanSearch, ChevronDown, Loader2 } from 'lucide-react';
import type { WatchlistVersion, WatchlistItem } from '@company-builder/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/utils/formatters';

interface WatchlistHeaderProps {
  versions: WatchlistVersion[];
  currentVersionId: string;
  currentVersion: WatchlistVersion | undefined;
  items: WatchlistItem[];
  onVersionChange: (id: string) => void;
}

export function WatchlistHeader({
  versions,
  currentVersionId,
  currentVersion,
  items,
  onVersionChange,
}: WatchlistHeaderProps) {
  const [scanning, setScanning] = useState(false);

  function handleExport() {
    const exportData = {
      version: currentVersion?.version_number,
      published_at: currentVersion?.published_at,
      items: items.map((item) => ({
        rank: item.rank,
        title: item.opportunity.title,
        score: item.score?.composite_score,
        market_category: item.opportunity.target_industry,
        agent_readiness: item.opportunity.agent_readiness_tag,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watchlist-v${currentVersion?.version_number ?? 'latest'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleTriggerScan() {
    setScanning(true);
    try {
      await fetch('/api/cron/phase-0-scan', { method: 'POST' });
    } catch {
      // Handle silently
    } finally {
      setScanning(false);
    }
  }

  const versionLabel = currentVersion
    ? `v${currentVersion.version_number} · ${formatDate(currentVersion.published_at)}`
    : 'Select version';

  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Left: Title + version selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Market Watchlist</h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full hover:bg-teal-100 transition-colors">
                    {versionLabel}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  {versions.map((v) => (
                    <DropdownMenuItem
                      key={v.id}
                      onSelect={() => onVersionChange(v.id)}
                      className={v.id === currentVersionId ? 'font-semibold text-teal-700' : ''}
                    >
                      v{v.version_number} · {formatDate(v.published_at)}
                      {v.id === currentVersionId && (
                        <span className="ml-auto text-xs text-teal-600">current</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-1.5 text-slate-700 border-slate-200 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={handleTriggerScan}
            disabled={scanning}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
          >
            {scanning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ScanSearch className="h-3.5 w-3.5" />
            )}
            {scanning ? 'Scanning…' : 'Trigger Scan'}
          </Button>
        </div>
      </div>

      {/* Summary text */}
      {currentVersion?.snapshot_data && (
        <p className="text-sm text-slate-500">
          {currentVersion.total_opportunities ?? currentVersion.snapshot_data.length} opportunities
          ranked across all market categories
        </p>
      )}
    </div>
  );
}
