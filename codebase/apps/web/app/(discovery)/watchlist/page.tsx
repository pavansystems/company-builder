import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { WatchlistVersion, WatchlistItem, MarketOpportunity, OpportunityScore } from '@company-builder/types';
import { WatchlistDashboard } from './components/WatchlistDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function WatchlistPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch all watchlist versions
  const { data: versionsRaw = [] } = await supabase
    .from('watchlist_versions')
    .select('*')
    .order('version_number', { ascending: false });

  const allVersions = (versionsRaw ?? []) as WatchlistVersion[];
  const latestVersion = allVersions[0];

  if (!latestVersion) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔭</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Watchlist Yet</h2>
          <p className="text-sm text-slate-500">
            Trigger your first market scan to populate the watchlist with opportunities.
          </p>
        </div>
      </div>
    );
  }

  // Fetch watchlist items for latest version (via snapshot_data references)
  const snapshotItems = latestVersion.snapshot_data ?? [];
  const opportunityIds = snapshotItems.map((s) => s.id);

  // Fetch full opportunity records
  const { data: opportunitiesRaw = [] } = opportunityIds.length > 0
    ? await supabase
        .from('market_opportunities')
        .select('*')
        .in('id', opportunityIds)
    : { data: [] };

  const opportunities = (opportunitiesRaw ?? []) as MarketOpportunity[];

  // Fetch scores for these opportunities
  const { data: scoresRaw = [] } = opportunityIds.length > 0
    ? await supabase
        .from('opportunity_scores')
        .select('*')
        .in('market_opportunity_id', opportunityIds)
        .order('scored_at', { ascending: false })
    : { data: [] };

  const scores = (scoresRaw ?? []) as OpportunityScore[];

  // Build watchlist items with rank from snapshot
  const watchlistItems: WatchlistItem[] = snapshotItems
    .map((snap) => {
      const opportunity = opportunities.find((o) => o.id === snap.id);
      if (!opportunity) return null;

      // Find most recent score for this opportunity
      const score = scores.find((s) => s.market_opportunity_id === snap.id) ?? null;

      return {
        opportunity,
        score,
        rank: snap.rank,
      } satisfies WatchlistItem;
    })
    .filter((item): item is WatchlistItem => item !== null)
    .sort((a, b) => a.rank - b.rank);

  const currentVersionData = {
    id: latestVersion.id,
    version_number: latestVersion.version_number,
    published_at: latestVersion.published_at,
    snapshot_data: latestVersion.snapshot_data,
    total_opportunities: latestVersion.total_opportunities,
    items: watchlistItems,
  };

  return (
    <WatchlistDashboard
      initialVersion={currentVersionData}
      allVersions={allVersions}
    />
  );
}
