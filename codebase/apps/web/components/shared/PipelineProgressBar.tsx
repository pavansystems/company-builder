import { cn } from '@/lib/utils';
import { PHASES } from '@/lib/constants/phases';

interface PipelineProgressBarProps {
  completed: number;
  total: number;
  phase: 0 | 1 | 2 | 3;
}

export function PipelineProgressBar({
  completed,
  total,
  phase,
}: PipelineProgressBarProps) {
  const phaseConfig = PHASES[phase];
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">
          {completed}/{total} steps
        </span>
        <span
          className={cn('text-xs font-semibold', phaseConfig.textClass)}
        >
          {percentage}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            phaseConfig.bgClass
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
