'use client';

import { Check, X, Loader2, Circle, TrendingUp, Users, DollarSign, Shield, BarChart2, Layers, Briefcase, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ValidationPhase } from '@company-builder/types';

export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface ValidationPhaseStatus {
  phase: ValidationPhase;
  status: PhaseStatus;
}

interface ValidationProgressProps {
  phases: ValidationPhaseStatus[];
}

const PHASE_CONFIG: Record<
  ValidationPhase,
  { label: string; icon: React.ReactNode; shortLabel: string }
> = {
  market_sizing: {
    label: 'Market Sizing',
    shortLabel: 'Market',
    icon: <BarChart2 className="h-4 w-4" />,
  },
  competitive: {
    label: 'Competitive Analysis',
    shortLabel: 'Competitive',
    icon: <Layers className="h-4 w-4" />,
  },
  customer: {
    label: 'Customer Validation',
    shortLabel: 'Customer',
    icon: <Users className="h-4 w-4" />,
  },
  feasibility: {
    label: 'Feasibility',
    shortLabel: 'Feasibility',
    icon: <Shield className="h-4 w-4" />,
  },
  economics: {
    label: 'Unit Economics',
    shortLabel: 'Economics',
    icon: <DollarSign className="h-4 w-4" />,
  },
  synthesis: {
    label: 'Synthesis',
    shortLabel: 'Synthesis',
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
};

function StepIcon({ status }: { status: PhaseStatus }) {
  if (status === 'completed') {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 shadow-sm shadow-amber-300">
        <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 shadow-sm shadow-red-300">
        <X className="h-4 w-4 text-white" strokeWidth={2.5} />
      </div>
    );
  }
  if (status === 'in_progress') {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-400">
        <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-slate-200">
      <Circle className="h-3 w-3 text-slate-300" />
    </div>
  );
}

export function ValidationProgress({ phases }: ValidationProgressProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-5">
        Validation Progress
      </h3>
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-100">
          {(() => {
            const completedCount = phases.filter((p) => p.status === 'completed').length;
            const pct = phases.length > 1 ? (completedCount / (phases.length - 1)) * 100 : 0;
            return (
              <div
                className="h-full bg-amber-400 transition-all duration-700"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            );
          })()}
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {phases.map(({ phase, status }) => {
            const config = PHASE_CONFIG[phase];
            return (
              <div
                key={phase}
                className="flex flex-col items-center gap-2"
                style={{ width: `${100 / phases.length}%` }}
              >
                <StepIcon status={status} />
                <div className="text-center">
                  <p
                    className={cn(
                      'text-[11px] font-semibold leading-tight',
                      status === 'completed'
                        ? 'text-amber-700'
                        : status === 'in_progress'
                        ? 'text-amber-600'
                        : status === 'failed'
                        ? 'text-red-600'
                        : 'text-slate-400'
                    )}
                  >
                    {config.shortLabel}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
                    {status === 'in_progress' ? 'Running...' : status}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
