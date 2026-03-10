'use client';

import type { GtmLaunchTimeline } from '@company-builder/types';
import { Rocket, TrendingUp, Zap } from 'lucide-react';

interface GtmTimelineProps {
  timeline: GtmLaunchTimeline;
}

const PHASES = [
  {
    key: 'day_1_30' as const,
    label: 'Pre-Launch',
    range: 'Day 1–30',
    icon: Zap,
    color: 'emerald',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    headerBg: 'bg-emerald-50',
    headerText: 'text-emerald-800',
    cardBg: 'bg-white',
    cardBorder: 'border-emerald-100',
    pillBg: 'bg-emerald-100',
    pillText: 'text-emerald-700',
  },
  {
    key: 'day_31_60' as const,
    label: 'Launch',
    range: 'Day 31–60',
    icon: Rocket,
    color: 'blue',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
    borderColor: 'border-blue-200',
    headerBg: 'bg-blue-50',
    headerText: 'text-blue-800',
    cardBg: 'bg-white',
    cardBorder: 'border-blue-100',
    pillBg: 'bg-blue-100',
    pillText: 'text-blue-700',
  },
  {
    key: 'day_61_90' as const,
    label: 'Growth',
    range: 'Day 61–90',
    icon: TrendingUp,
    color: 'violet',
    iconBg: 'bg-violet-100',
    iconText: 'text-violet-600',
    borderColor: 'border-violet-200',
    headerBg: 'bg-violet-50',
    headerText: 'text-violet-800',
    cardBg: 'bg-white',
    cardBorder: 'border-violet-100',
    pillBg: 'bg-violet-100',
    pillText: 'text-violet-700',
  },
];

export function GtmTimeline({ timeline }: GtmTimelineProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {PHASES.map(({ key, label, range, icon: Icon, iconBg, iconText, borderColor, headerBg, headerText, cardBg, cardBorder, pillBg, pillText }) => {
        const milestones = timeline[key] ?? [];

        return (
          <div
            key={key}
            className={`rounded-xl border ${borderColor} overflow-hidden flex flex-col`}
          >
            {/* Phase header */}
            <div className={`${headerBg} px-4 py-3 flex items-center gap-2.5`}>
              <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-4 w-4 ${iconText}`} />
              </div>
              <div>
                <p className={`font-bold text-sm ${headerText}`}>{label}</p>
                <p className={`text-xs ${headerText} opacity-70`}>{range}</p>
              </div>
            </div>

            {/* Milestones */}
            <div className="p-3 space-y-2 flex-1">
              {milestones.length > 0 ? (
                milestones.map((milestone, i) => (
                  <div
                    key={i}
                    className={`${cardBg} ${cardBorder} border rounded-lg px-3 py-2.5`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`w-5 h-5 rounded-full ${pillBg} ${pillText} text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        {i + 1}
                      </span>
                      <p className="text-xs text-slate-700 leading-snug">{milestone}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic px-1 py-2">No milestones defined</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
