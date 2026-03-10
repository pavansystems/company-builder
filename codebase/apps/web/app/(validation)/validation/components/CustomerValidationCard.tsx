import type { Validation } from '@company-builder/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { TrendingUp, Users, CheckCircle } from 'lucide-react';

interface CustomerValidationCardProps {
  validation: Validation;
}

function WTPRange({ low, high }: { low: number | null; high: number | null }) {
  if (low === null && high === null) return <span className="text-slate-400">—</span>;
  const l = low ?? 0;
  const h = high ?? 0;
  const pctFill = 60; // visual only — show range as proportional bar

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-amber-600">{formatCurrency(l)}</span>
        <span className="text-slate-400 text-xs">to</span>
        <span className="font-semibold text-amber-600">{formatCurrency(h)}</span>
      </div>
      <div className="h-2 rounded-full bg-amber-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-700"
          style={{ width: `${pctFill}%`, marginLeft: '20%' }}
        />
      </div>
    </div>
  );
}

export function CustomerValidationCard({ validation }: CustomerValidationCardProps) {
  const evidence = validation.pain_point_evidence ?? [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Left: Pain validation evidence */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-500" />
          Pain Validation Evidence
        </h3>

        {evidence.length > 0 ? (
          <div className="space-y-3">
            {evidence.map((item, i) => (
              <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2">
                <p className="text-sm font-semibold text-slate-800">{item.pain_point}</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  {item.search_volume != null && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <span className="font-semibold text-amber-600">
                        {item.search_volume.toLocaleString()}
                      </span>
                      <span>searches/mo</span>
                    </div>
                  )}
                  {item.sentiment && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <span className="font-semibold capitalize">{item.sentiment}</span>
                      <span>sentiment</span>
                    </div>
                  )}
                  {item.willingness_to_pay != null && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(item.willingness_to_pay)}
                      </span>
                      <span>WTP</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No pain point evidence collected yet.</p>
        )}

        {/* WTP range */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Willingness to Pay Range
          </p>
          <WTPRange
            low={validation.willingness_to_pay_low}
            high={validation.willingness_to_pay_high}
          />
        </div>
      </div>

      {/* Right: Customer profile */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
          <Users className="h-4 w-4 text-amber-500" />
          Customer Profile
        </h3>

        {validation.early_adopter_profile && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
              Early Adopter Profile
            </p>
            <p className="text-sm text-amber-900">{validation.early_adopter_profile}</p>
          </div>
        )}

        {validation.customer_validation_confidence != null && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Validation Confidence
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-700"
                  style={{ width: `${validation.customer_validation_confidence}%` }}
                />
              </div>
              <span className="text-sm font-bold text-amber-700 tabular-nums">
                {validation.customer_validation_confidence}%
              </span>
            </div>
          </div>
        )}

        {/* Required AI capabilities as jobs-to-be-done proxy */}
        {validation.required_ai_capabilities && validation.required_ai_capabilities.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Required Capabilities
            </p>
            <ul className="space-y-1.5">
              {validation.required_ai_capabilities.map((cap, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  {cap}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
