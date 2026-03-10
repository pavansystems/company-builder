import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricTileProps {
  value: string | number;
  label: string;
  delta?: number;
  icon?: LucideIcon;
  color?: string;
  className?: string;
}

export function MetricTile({
  value,
  label,
  delta,
  icon: Icon,
  color,
  className,
}: MetricTileProps) {
  const hasDelta = typeof delta === 'number';
  const isPositive = hasDelta && delta > 0;
  const isNegative = hasDelta && delta < 0;
  const isNeutral = hasDelta && delta === 0;

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-5',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={
              color
                ? { backgroundColor: `${color}15` }
                : { backgroundColor: '#f1f5f9' }
            }
          >
            <Icon
              className="h-4 w-4"
              style={color ? { color } : { color: '#64748b' }}
            />
          </div>
        )}
      </div>

      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>

      {hasDelta && (
        <div
          className={cn(
            'flex items-center gap-1 mt-1.5 text-xs font-medium',
            isPositive && 'text-green-600',
            isNegative && 'text-red-600',
            isNeutral && 'text-slate-500'
          )}
        >
          {isPositive && <TrendingUp className="h-3.5 w-3.5" />}
          {isNegative && <TrendingDown className="h-3.5 w-3.5" />}
          {isNeutral && <Minus className="h-3.5 w-3.5" />}
          <span>
            {isPositive ? '+' : ''}
            {delta}% vs last week
          </span>
        </div>
      )}
    </div>
  );
}
