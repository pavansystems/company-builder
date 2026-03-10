import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AgentRolesTable } from '../../../components/AgentRolesTable';
import { formatCurrency } from '@/lib/utils/formatters';
import { Bot } from 'lucide-react';
import type { Blueprint } from '@company-builder/types';

interface PageProps {
  params: Promise<{ blueprintId: string }>;
}

export default async function AgentArchitecturePage({ params }: PageProps) {
  const { blueprintId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: blueprintRaw } = await supabase
    .from('blueprints')
    .select('*')
    .eq('id', blueprintId)
    .single();

  if (!blueprintRaw) notFound();
  const blueprint = blueprintRaw as unknown as Blueprint;

  const agentRoles = (blueprint.agent_roles as any[]) ?? [];
  const humanRoles = (blueprint.human_roles as any[]) ?? [];
  const costs = blueprint.operational_cost_breakdown as any;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-100">
          <Bot className="h-5 w-5 text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Agent Architecture</h1>
      </div>

      {/* Operational cost breakdown */}
      {costs && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Agent Compute', value: costs.agent_compute },
            { label: 'Human Cost', value: costs.human },
            { label: 'Tools & APIs', value: costs.tools },
            { label: 'Total Monthly', value: costs.total },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-4 text-center"
            >
              <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
              <p className="text-lg font-black text-emerald-700 tabular-nums">
                {formatCurrency(value ?? 0)}
              </p>
              <p className="text-[10px] text-slate-400">per month</p>
            </div>
          ))}
        </div>
      )}

      {agentRoles.length > 0 || humanRoles.length > 0 ? (
        <AgentRolesTable agentRoles={agentRoles} humanRoles={humanRoles} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <Bot className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400">No agent or human roles defined yet.</p>
        </div>
      )}

      {/* Escalation protocols */}
      {blueprint.escalation_protocols && (blueprint.escalation_protocols as any[]).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Escalation Protocols
          </h2>
          <div className="space-y-3">
            {(blueprint.escalation_protocols as any[]).map((ep, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                      Trigger
                    </p>
                    <p className="text-sm text-slate-800">{ep.trigger}</p>
                  </div>
                  {ep.sla_minutes && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 shrink-0">
                      SLA: {ep.sla_minutes}min
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                    Escalation Path
                  </p>
                  <p className="text-sm text-slate-700">{ep.escalation_path}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
