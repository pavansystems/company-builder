import { Check, Telescope, Lightbulb, FlaskConical, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhaseCounts {
  discovery: number;
  ideation: number;
  validation: number;
  blueprint: number;
}

interface PhaseNavProps {
  currentPhase: 0 | 1 | 2 | 3;
  phaseCounts: PhaseCounts;
}

const phases = [
  {
    id: 0 as const,
    key: 'discovery' as const,
    label: 'Discovery',
    icon: Telescope,
    color: '#0D9488',
    bgClass: 'bg-teal-600',
    textClass: 'text-teal-600',
    borderClass: 'border-teal-600',
    lightBgClass: 'bg-teal-50',
  },
  {
    id: 1 as const,
    key: 'ideation' as const,
    label: 'Ideation',
    icon: Lightbulb,
    color: '#7C3AED',
    bgClass: 'bg-violet-600',
    textClass: 'text-violet-600',
    borderClass: 'border-violet-600',
    lightBgClass: 'bg-violet-50',
  },
  {
    id: 2 as const,
    key: 'validation' as const,
    label: 'Validation',
    icon: FlaskConical,
    color: '#D97706',
    bgClass: 'bg-amber-600',
    textClass: 'text-amber-600',
    borderClass: 'border-amber-600',
    lightBgClass: 'bg-amber-50',
  },
  {
    id: 3 as const,
    key: 'blueprint' as const,
    label: 'Blueprint',
    icon: FileText,
    color: '#059669',
    bgClass: 'bg-emerald-600',
    textClass: 'text-emerald-600',
    borderClass: 'border-emerald-600',
    lightBgClass: 'bg-emerald-50',
  },
];

export function PhaseNav({ currentPhase, phaseCounts }: PhaseNavProps) {
  return (
    <nav className="flex items-center gap-0">
      {phases.map((phase, index) => {
        const isCompleted = phase.id < currentPhase;
        const isActive = phase.id === currentPhase;
        const isFuture = phase.id > currentPhase;
        const Icon = phase.icon;
        const count = phaseCounts[phase.key];

        return (
          <div key={phase.id} className="flex items-center">
            <div
              className={cn(
                'flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-all',
                isActive && phase.lightBgClass,
                isFuture && 'opacity-40'
              )}
            >
              {/* Step indicator */}
              <div
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all',
                  isCompleted && 'bg-green-600 text-white',
                  isActive && `${phase.bgClass} text-white`,
                  isFuture && 'bg-slate-200 text-slate-500'
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3 w-3" />
                )}
              </div>

              {/* Label & count */}
              <div className="flex flex-col">
                <span
                  className={cn(
                    'text-xs font-semibold leading-none',
                    isActive && phase.textClass,
                    isCompleted && 'text-green-600',
                    isFuture && 'text-slate-400'
                  )}
                >
                  {phase.label}
                </span>
                {count > 0 && (
                  <span
                    className={cn(
                      'text-xs mt-0.5 leading-none',
                      isActive && 'text-slate-600',
                      isCompleted && 'text-slate-500',
                      isFuture && 'text-slate-400'
                    )}
                  >
                    {count} item{count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Count badge */}
              {count > 0 && (
                <span
                  className={cn(
                    'ml-1 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-xs font-semibold px-1.5',
                    isActive
                      ? `${phase.bgClass} text-white`
                      : isCompleted
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {count}
                </span>
              )}
            </div>

            {/* Connector */}
            {index < phases.length - 1 && (
              <div
                className={cn(
                  'w-8 h-px',
                  index < currentPhase ? 'bg-green-400' : 'bg-slate-200'
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
