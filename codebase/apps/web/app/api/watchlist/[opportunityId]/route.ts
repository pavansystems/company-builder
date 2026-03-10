import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { MarketOpportunity, OpportunityScore, Signal, WatchlistVersion } from '@company-builder/types';

interface RouteParams {
  params: { opportunityId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { opportunityId } = params;
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('includeHistory') === 'true';

    // Fetch opportunity
    const { data: opportunityRaw, error: oppError } = await supabase
      .from('market_opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (oppError || !opportunityRaw) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const opportunity = opportunityRaw as MarketOpportunity;

    // Fetch all scores for this opportunity
    const { data: scoresRaw = [] } = await supabase
      .from('opportunity_scores')
      .select('*')
      .eq('market_opportunity_id', opportunityId)
      .order('scored_at', { ascending: false });

    const scores = (scoresRaw ?? []) as OpportunityScore[];
    const latestScore = scores[0] ?? null;

    // Fetch related signals
    const signalIds = opportunity.enabling_signals ?? [];
    const { data: signalsRaw = [] } = signalIds.length > 0
      ? await supabase
          .from('signals')
          .select('*')
          .in('id', signalIds)
          .eq('is_archived', false)
          .order('detected_at', { ascending: false })
      : { data: [] };

    const signals = (signalsRaw ?? []) as Signal[];

    // Build score history from watchlist versions if requested
    let history: Array<{ version_number: number; published_at: string; score: number }> = [];
    if (includeHistory) {
      const { data: versionsRaw = [] } = await supabase
        .from('watchlist_versions')
        .select('id, version_number, published_at, snapshot_data')
        .order('version_number', { ascending: true });

      const versions = (versionsRaw ?? []) as WatchlistVersion[];

      // Build history from snapshot data
      const versionHistory = versions
        .map((v) => {
          const snapItem = v.snapshot_data?.find((s) => s.id === opportunityId);
          if (!snapItem) return null;
          return {
            version_number: v.version_number,
            published_at: v.published_at,
            score: snapItem.score,
          };
        })
        .filter((h): h is { version_number: number; published_at: string; score: number } => h !== null);

      // Merge with actual score records for accuracy
      history = versionHistory.length > 0 ? versionHistory : scores.map((s) => ({
        version_number: 0,
        published_at: s.scored_at,
        score: s.composite_score ?? 0,
      }));
    }

    return NextResponse.json({
      opportunity,
      score: latestScore,
      signals,
      ...(includeHistory ? { history } : {}),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
