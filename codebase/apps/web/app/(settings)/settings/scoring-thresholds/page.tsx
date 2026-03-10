import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ThresholdEditor } from '../components/ThresholdEditor';
import { SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: 'Scoring Thresholds | Settings' };

export default async function ScoringThresholdsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: gateRules } = await supabase
    .from('gate_rules')
    .select('*')
    .order('created_at', { ascending: true });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/settings" className="hover:text-slate-800 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Settings
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Scoring Thresholds</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100">
          <SlidersHorizontal className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Scoring Thresholds</h1>
          <p className="text-sm text-slate-500">
            Configure gate rules controlling automatic advancement between pipeline phases.
          </p>
        </div>
      </div>

      {(gateRules ?? []).length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-400">No gate rules configured. Add rules via the database.</p>
        </div>
      ) : (
        <ThresholdEditor gateRules={gateRules as any} />
      )}
    </div>
  );
}
