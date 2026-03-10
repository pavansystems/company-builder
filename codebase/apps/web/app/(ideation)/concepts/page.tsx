import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ConceptGrid } from './components/ConceptGrid';
import type { ConceptWithScore } from './components/ConceptCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Lightbulb } from 'lucide-react';

export const metadata = { title: 'Concepts | Company Builder' };

export default async function ConceptsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: concepts } = await supabase
    .from('concepts')
    .select('*')
    .order('generated_at', { ascending: false });

  const { data: scores } = await supabase
    .from('concept_scores')
    .select('*');

  const scoreMap = new Map((scores ?? []).map((s) => [s.concept_id, s]));

  const conceptsWithScores: ConceptWithScore[] = (concepts ?? []).map((concept) => ({
    concept: concept as unknown as ConceptWithScore['concept'],
    score: scoreMap.get(concept.id) ?? null,
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100">
          <Lightbulb className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Concepts</h1>
          <p className="text-sm text-slate-500">
            Review, compare, and advance concepts through the pipeline.
          </p>
        </div>
        <div className="ml-auto">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-violet-100 text-violet-700">
            {conceptsWithScores.length} concept{conceptsWithScores.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Grid */}
      {conceptsWithScores.length === 0 ? (
        <EmptyState
          title="No concepts yet"
          description="Concepts will appear here once the ideation agents have generated them from your opportunities."
        />
      ) : (
        <ConceptGrid initialConcepts={conceptsWithScores} />
      )}
    </div>
  );
}
