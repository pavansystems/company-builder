import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { GtmTimeline } from '../../../components/GtmTimeline';
import { Rocket, CheckCircle, Bot } from 'lucide-react';
import type { GtmChannel, Blueprint } from '@company-builder/types';

interface PageProps {
  params: Promise<{ blueprintId: string }>;
}

function ChannelsTable({ channels }: { channels: GtmChannel[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Channel
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Agent-Handled
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tactics
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {channels.map((ch, i) => (
            <tr key={i} className="hover:bg-slate-50/50">
              <td className="px-4 py-3 font-semibold text-slate-800">{ch.channel}</td>
              <td className="px-4 py-3 text-center">
                {ch.agent_handled ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                    <Bot className="h-3 w-3" />
                    Agent
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                    Human
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <ul className="space-y-1">
                  {ch.tactics.map((t, j) => (
                    <li key={j} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-300 shrink-0 mt-0.5" />
                      {t}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function GtmPlanPage({ params }: PageProps) {
  const { blueprintId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: blueprintRaw } = await supabase
    .from('blueprints')
    .select('*')
    .eq('id', blueprintId)
    .single();

  if (!blueprintRaw) notFound();
  const blueprint = blueprintRaw as unknown as Blueprint;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-100">
          <Rocket className="h-5 w-5 text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Go-to-Market Plan</h1>
      </div>

      {/* Target segment */}
      {blueprint.gtm_target_segment && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">
            Target Segment
          </p>
          <p className="text-slate-800 text-base font-medium">{blueprint.gtm_target_segment}</p>
        </div>
      )}

      {/* Messaging framework */}
      {blueprint.gtm_messaging_framework && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Messaging Framework
          </h2>
          <p className="text-slate-800 leading-relaxed whitespace-pre-line">
            {blueprint.gtm_messaging_framework}
          </p>
        </div>
      )}

      {/* GTM timeline */}
      {blueprint.gtm_launch_timeline && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Launch Timeline
          </h2>
          <GtmTimeline timeline={blueprint.gtm_launch_timeline as any} />
        </div>
      )}

      {/* Channels table */}
      {blueprint.gtm_channels && (blueprint.gtm_channels as GtmChannel[]).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            GTM Channels
          </h2>
          <ChannelsTable channels={blueprint.gtm_channels as GtmChannel[]} />
        </div>
      )}

      {/* Agent vs Human GTM activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {blueprint.agent_gtm_activities && blueprint.agent_gtm_activities.length > 0 && (
          <div className="rounded-xl border border-emerald-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Bot className="h-4 w-4" />
              Agent GTM Activities
            </h3>
            <ul className="space-y-2">
              {(blueprint.agent_gtm_activities as string[]).map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
        {blueprint.human_gtm_activities && blueprint.human_gtm_activities.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
              Human GTM Activities
            </h3>
            <ul className="space-y-2">
              {(blueprint.human_gtm_activities as string[]).map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
