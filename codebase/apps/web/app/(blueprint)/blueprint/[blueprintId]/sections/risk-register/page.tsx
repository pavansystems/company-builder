import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { RiskRegisterTable } from '../../../components/RiskRegisterTable';
import { Shield } from 'lucide-react';
import type { RiskItem } from '@company-builder/types';

interface PageProps {
  params: Promise<{ blueprintId: string }>;
}

export default async function RiskRegisterPage({ params }: PageProps) {
  const { blueprintId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: blueprint } = await supabase
    .from('blueprints')
    .select('id, risks')
    .eq('id', blueprintId)
    .single();

  if (!blueprint) notFound();

  const risks = (blueprint.risks as RiskItem[]) ?? [];

  // Risk stats
  const criticalRisks = risks.filter((r) => r.severity === 'critical' || r.severity === 'high');
  const highLikelihood = risks.filter((r) => r.likelihood === 'high');

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-100">
          <Shield className="h-5 w-5 text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Risk Register</h1>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-black text-slate-900">{risks.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Risks</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-2xl font-black text-red-700">{criticalRisks.length}</p>
          <p className="text-xs text-red-500 mt-0.5">High/Critical</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-2xl font-black text-amber-700">{highLikelihood.length}</p>
          <p className="text-xs text-amber-500 mt-0.5">High Likelihood</p>
        </div>
      </div>

      {risks.length > 0 ? (
        <RiskRegisterTable risks={risks} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <Shield className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400">No risks defined in this blueprint.</p>
        </div>
      )}
    </div>
  );
}
