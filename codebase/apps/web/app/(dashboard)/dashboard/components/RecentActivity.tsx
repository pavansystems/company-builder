'use client';

import { useEffect, useState } from 'react';
import { Bot, CheckCircle, XCircle, AlertCircle, Clock, Activity } from 'lucide-react';
import type { PipelineEvent } from '@company-builder/types';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';

interface RecentActivityProps {
  initialEvents: PipelineEvent[];
}

const eventTypeConfig: Record<
  string,
  { icon: React.ElementType; label: string; color: string; bgColor: string }
> = {
  agent_completed: {
    icon: Bot,
    label: 'Agent completed',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  agent_failed: {
    icon: Bot,
    label: 'Agent failed',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  gate_approved: {
    icon: CheckCircle,
    label: 'Gate approved',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  gate_rejected: {
    icon: XCircle,
    label: 'Gate rejected',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  blocked: {
    icon: AlertCircle,
    label: 'Item blocked',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  status_changed: {
    icon: Activity,
    label: 'Status changed',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  phase_advanced: {
    icon: CheckCircle,
    label: 'Phase advanced',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
};

const DEFAULT_CONFIG = {
  icon: Clock,
  label: 'Event',
  color: 'text-slate-600',
  bgColor: 'bg-slate-100',
};

function getEventConfig(eventType: string) {
  return eventTypeConfig[eventType] ?? DEFAULT_CONFIG;
}

function getEntityRef(event: PipelineEvent): string {
  const payload = event.payload as Record<string, unknown> | null;
  if (!payload) return event.pipeline_item_id.slice(0, 8);
  const name = payload.entity_name ?? payload.title ?? payload.name;
  if (typeof name === 'string') return name;
  return event.pipeline_item_id.slice(0, 8);
}

export function RecentActivity({ initialEvents }: RecentActivityProps) {
  const [events, setEvents] = useState<PipelineEvent[]>(initialEvents);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const channel = supabase
      .channel('pipeline_events_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pipeline_events' },
        (payload) => {
          const newEvent = payload.new as PipelineEvent;
          setEvents((prev) => [newEvent, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
          <p className="text-xs text-slate-500 mt-0.5">Live pipeline events</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-slate-400">Live</span>
        </div>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-slate-50">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Activity className="h-8 w-8 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No recent activity</p>
            <p className="text-xs text-slate-400 mt-1">Events will appear here in real time</p>
          </div>
        ) : (
          events.map((event) => {
            const config = getEventConfig(event.event_type);
            const Icon = config.icon;
            const ref = getEntityRef(event);

            return (
              <div
                key={event.id}
                className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-lg mt-0.5 shrink-0',
                    config.bgColor
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">{config.label}</span>
                    <span className="text-xs text-slate-400 shrink-0">
                      {formatRelativeTime(event.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{ref}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
