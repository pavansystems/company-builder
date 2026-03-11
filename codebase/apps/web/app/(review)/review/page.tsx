import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ShieldCheck } from 'lucide-react';
import { ReviewQueueTable } from './components/ReviewQueueTable';
import { EmptyState } from '@/components/shared/EmptyState';

export const metadata = { title: 'Review Queue | Company Builder' };

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ReviewPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch items needing review: blocked or last_gate_decision = 'review'
  const { data: reviewItems = [] } = await supabase
    .from('pipeline_items')
    .select('*')
    .or('status.eq.blocked,last_gate_decision.eq.review')
    .order('entered_phase_at', { ascending: true });

  const items = reviewItems ?? [];

  // Enrich items with titles from related tables
  const conceptIds = items
    .map((i) => i.concept_id)
    .filter((id): id is string => id !== null);
  const opportunityIds = items
    .map((i) => i.market_opportunity_id)
    .filter((id): id is string => id !== null);

  // Fetch concept titles
  const { data: concepts = [] } = conceptIds.length > 0
    ? await supabase.from('concepts').select('id, title').in('id', conceptIds)
    : { data: [] };

  // Fetch opportunity titles
  const { data: opportunities = [] } = opportunityIds.length > 0
    ? await supabase.from('market_opportunities').select('id, title').in('id', opportunityIds)
    : { data: [] };

  // Fetch concept scores for composite_score
  const { data: conceptScores = [] } = conceptIds.length > 0
    ? await supabase.from('concept_scores').select('concept_id, composite_score').in('concept_id', conceptIds)
    : { data: [] };

  // Fetch opportunity scores
  const { data: opportunityScores = [] } = opportunityIds.length > 0
    ? await supabase.from('opportunity_scores').select('market_opportunity_id, composite_score').in('market_opportunity_id', opportunityIds)
    : { data: [] };

  const conceptMap = new Map((concepts ?? []).map((c) => [c.id, c.title]));
  const opportunityMap = new Map((opportunities ?? []).map((o) => [o.id, o.title]));
  const conceptScoreMap = new Map((conceptScores ?? []).map((s) => [s.concept_id, s.composite_score]));
  const opportunityScoreMap = new Map((opportunityScores ?? []).map((s) => [s.market_opportunity_id, s.composite_score]));

  const enrichedItems = items.map((item) => {
    const title =
      (item.concept_id ? conceptMap.get(item.concept_id) : null) ??
      (item.market_opportunity_id ? opportunityMap.get(item.market_opportunity_id) : null) ??
      'Untitled';

    const composite_score =
      (item.concept_id ? conceptScoreMap.get(item.concept_id) : null) ??
      (item.market_opportunity_id ? opportunityScoreMap.get(item.market_opportunity_id) : null) ??
      null;

    return { ...item, title, composite_score };
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-100">
          <ShieldCheck className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review Queue</h1>
          <p className="text-sm text-slate-500">
            Pipeline items awaiting human review and gate decisions.
          </p>
        </div>
        <div className="ml-auto">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
            {enrichedItems.length} pending
          </span>
        </div>
      </div>

      {/* Queue */}
      {enrichedItems.length === 0 ? (
        <EmptyState
          title="No items pending review"
          description="All pipeline items are progressing normally. Items will appear here when they need human review at gate transitions."
          icon={ShieldCheck}
        />
      ) : (
        <ReviewQueueTable items={enrichedItems} />
      )}
    </div>
  );
}
