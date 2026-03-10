import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate } from '@/lib/utils/formatters';
import { BookOpen, ChevronRight, CheckCircle } from 'lucide-react';

export const metadata = { title: 'Blueprints | Company Builder' };

export default async function BlueprintListPage() {
  const supabase = await createServerSupabaseClient();

  const { data: blueprints } = await supabase
    .from('blueprints')
    .select('id, concept_id, executive_summary, is_finalized, created_at, revenue_model, runway_months')
    .eq('is_finalized', true)
    .order('created_at', { ascending: false });

  const conceptIds = (blueprints ?? []).map((b) => b.concept_id).filter(Boolean);
  let conceptMap = new Map<string, string>();

  if (conceptIds.length > 0) {
    const { data: concepts } = await supabase
      .from('concepts')
      .select('id, title')
      .in('id', conceptIds);
    conceptMap = new Map((concepts ?? []).map((c) => [c.id, c.title]));
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100">
          <BookOpen className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blueprints</h1>
          <p className="text-sm text-slate-500">
            Finalized go-to-market blueprints ready for review and export.
          </p>
        </div>
        <span className="ml-auto inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
          {(blueprints ?? []).length} blueprint{(blueprints ?? []).length !== 1 ? 's' : ''}
        </span>
      </div>

      {(blueprints ?? []).length === 0 ? (
        <EmptyState
          title="No blueprints yet"
          description="Blueprints appear here once the blueprint packaging phase is complete for a validated concept."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(blueprints ?? []).map((blueprint) => {
            const title = conceptMap.get(blueprint.concept_id ?? '') ?? 'Untitled Blueprint';
            return (
              <Link
                key={blueprint.id}
                href={`/blueprint/${blueprint.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-emerald-300 transition-all duration-200 space-y-3 block"
              >
                {/* Left accent */}
                <div className="flex items-start gap-3">
                  <div className="w-1 h-12 rounded-full bg-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 text-base">
                        {title}
                      </h3>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 shrink-0 transition-colors" />
                    </div>
                    {blueprint.revenue_model && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 capitalize">
                        {blueprint.revenue_model.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>

                {blueprint.executive_summary && (
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {blueprint.executive_summary}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span className="font-medium">Finalized</span>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(blueprint.created_at)}</span>
                </div>

                {blueprint.runway_months && (
                  <div className="pt-1 border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      Runway: <strong className="text-slate-700">{blueprint.runway_months} months</strong>
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
