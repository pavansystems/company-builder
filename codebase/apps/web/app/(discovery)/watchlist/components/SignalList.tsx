import type { Signal } from '@company-builder/types';
import { cn } from '@/lib/utils';

interface SignalListProps {
  signals: Signal[];
}

const SIGNAL_TYPE_STYLES: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  tech_breakthrough: {
    label: 'Tech Breakthrough',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  regulatory_shift: {
    label: 'Regulatory Shift',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  market_event: {
    label: 'Market Event',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  customer_pain: {
    label: 'Customer Pain',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
  },
};

const IMPACT_COLORS: Record<string, string> = {
  low: 'bg-slate-200',
  medium: 'bg-amber-300',
  high: 'bg-orange-400',
  critical: 'bg-red-500',
};

const DEFAULT_SIGNAL_STYLE = {
  label: 'Signal',
  bg: 'bg-slate-50',
  text: 'text-slate-600',
  border: 'border-slate-200',
};

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400';

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[48px]">
        <div
          className={cn('h-full rounded-full', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}

export function SignalList({ signals }: SignalListProps) {
  if (signals.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <p className="text-sm">No signals recorded for this opportunity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {signals.map((signal) => {
        const style = SIGNAL_TYPE_STYLES[signal.signal_type] ?? DEFAULT_SIGNAL_STYLE;
        const impactColor = signal.impact_rating
          ? IMPACT_COLORS[signal.impact_rating] ?? 'bg-slate-200'
          : 'bg-slate-200';

        return (
          <div
            key={signal.id}
            className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full border',
                    style.bg,
                    style.text,
                    style.border
                  )}
                >
                  {style.label}
                </span>
                {signal.impact_rating && (
                  <div className="flex items-center gap-1">
                    <div className={cn('w-2 h-2 rounded-full', impactColor)} />
                    <span className="text-xs text-slate-500 capitalize">
                      {signal.impact_rating} impact
                    </span>
                  </div>
                )}
                {signal.entities?.trends && signal.entities.trends.length > 0 && (
                  <span className="text-xs text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full font-medium">
                    {signal.entities.trends[0]}
                  </span>
                )}
              </div>
              {signal.confidence !== null && signal.confidence !== undefined && (
                <div className="flex items-center gap-2 min-w-[100px]">
                  <span className="text-xs text-slate-400">Confidence</span>
                  <ConfidenceBar confidence={signal.confidence} />
                </div>
              )}
            </div>

            {/* Summary */}
            <p className="text-sm text-slate-700 leading-relaxed">{signal.summary}</p>

            {/* Entities */}
            {signal.entities && (
              <div className="flex flex-wrap gap-1.5">
                {signal.entities.companies?.map((c) => (
                  <span
                    key={c}
                    className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium"
                  >
                    {c}
                  </span>
                ))}
                {signal.entities.technologies?.map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
