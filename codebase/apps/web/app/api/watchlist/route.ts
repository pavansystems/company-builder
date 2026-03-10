import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  WatchlistVersion,
  MarketOpportunity,
  OpportunityScore,
  WatchlistItem,
} from '@company-builder/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get('versionId');

    // Fetch specific version or latest
    let versionQuery = supabase
      .from('watchlist_versions')
      .select('*')
      .order('version_number', { ascending: false });

    if (versionId) {
      versionQuery = versionQuery.eq('id', versionId);
    }

    const { data: versionRaw, error: versionError } = await versionQuery.limit(1).single();

    if (versionError || !versionRaw) {
      return NextResponse.json({ error: 'Watchlist version not found' }, { status: 404 });
    }

    const version = versionRaw as WatchlistVersion;
    const snapshotItems = version.snapshot_data ?? [];
    const opportunityIds = snapshotItems.map((s) => s.id);

    if (opportunityIds.length === 0) {
      return NextResponse.json({
        id: version.id,
        version_number: version.version_number,
        published_at: version.published_at,
        snapshot_data: version.snapshot_data,
        total_opportunities: version.total_opportunities,
        items: [],
      });
    }

    // Fetch opportunities
    const { data: opportunitiesRaw = [] } = await supabase
      .from('market_opportunities')
      .select('*')
      .in('id', opportunityIds);

    const opportunities = (opportunitiesRaw ?? []) as MarketOpportunity[];

    // Fetch scores
    const { data: scoresRaw = [] } = await supabase
      .from('opportunity_scores')
      .select('*')
      .in('market_opportunity_id', opportunityIds)
      .order('scored_at', { ascending: false });

    const scores = (scoresRaw ?? []) as OpportunityScore[];

    // Deduplicate scores (keep most recent per opportunity)
    const latestScores = new Map<string, OpportunityScore>();
    for (const score of scores) {
      if (!latestScores.has(score.market_opportunity_id)) {
        latestScores.set(score.market_opportunity_id, score);
      }
    }

    // Build watchlist items
    const items: WatchlistItem[] = snapshotItems
      .map((snap) => {
        const opportunity = opportunities.find((o) => o.id === snap.id);
        if (!opportunity) return null;
        return {
          opportunity,
          score: latestScores.get(snap.id) ?? null,
          rank: snap.rank,
        } satisfies WatchlistItem;
      })
      .filter((item): item is WatchlistItem => item !== null)
      .sort((a, b) => a.rank - b.rank);

    return NextResponse.json({
      id: version.id,
      version_number: version.version_number,
      published_at: version.published_at,
      snapshot_data: version.snapshot_data,
      total_opportunities: version.total_opportunities,
      items,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
