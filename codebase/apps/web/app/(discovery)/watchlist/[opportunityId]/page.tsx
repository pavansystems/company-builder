import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { MarketOpportunity, OpportunityScore, Signal } from '@company-builder/types';
import { OpportunityDetail } from '../components/OpportunityDetail';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { opportunityId: string };
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { opportunityId } = params;
  const supabase = await createServerSupabaseClient();

  // Fetch the opportunity
  const { data: opportunityRaw, error: oppError } = await supabase
    .from('market_opportunities')
    .select('*')
    .eq('id', opportunityId)
    .single();

  if (oppError || !opportunityRaw) {
    notFound();
  }

  const opportunity = opportunityRaw as MarketOpportunity;

  // Fetch most recent score
  const { data: scoreRaw } = await supabase
    .from('opportunity_scores')
    .select('*')
    .eq('market_opportunity_id', opportunityId)
    .order('scored_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const score = (scoreRaw as OpportunityScore | null) ?? null;

  // Fetch signals related to this opportunity (via enabling_signals or content linkage)
  // Since signals link to content_item_id, we look up via market_opportunity enabling_signals
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

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-5">
        <Link
          href="/watchlist"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Watchlist
        </Link>
      </div>

      <OpportunityDetail
        opportunity={opportunity}
        score={score}
        signals={signals}
      />
    </div>
  );
}
