'use client';

import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SynthesisVerdictProps {
  verdict: 'go' | 'no_go' | 'go_with_caution' | 'conditional';
  confidence: number;
  executiveSummary: string;
  keyStrengths: string[];
  keyRisks: string[];
  conditions?: string[];
}

type VerdictDisplay = {
  label: string;
  icon: React.ReactNode;
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeBg: string;
  badgeText: string;
};

function getVerdictDisplay(verdict: SynthesisVerdictProps['verdict']): VerdictDisplay {
  if (verdict === 'go') {
    return {
      label: 'GO',
      icon: <CheckCircle2 className="h-10 w-10 text-white" />,
      bgClass: 'bg-gradient-to-br from-green-500 to-emerald-600',
      borderClass: 'border-green-300',
      textClass: 'text-green-700',
      badgeBg: 'bg-green-600',
      badgeText: 'text-white',
    };
  }
  if (verdict === 'no_go') {
    return {
      label: 'NO GO',
      icon: <XCircle className="h-10 w-10 text-white" />,
      bgClass: 'bg-gradient-to-br from-red-500 to-rose-600',
      borderClass: 'border-red-300',
      textClass: 'text-red-700',
      badgeBg: 'bg-red-600',
      badgeText: 'text-white',
    };
  }
  return {
    label: 'CONDITIONAL',
    icon: <AlertTriangle className="h-10 w-10 text-white" />,
    bgClass: 'bg-gradient-to-br from-amber-500 to-orange-500',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-700',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-white',
  };
}

function ConfidenceArc({ confidence }: { confidence: number }) {
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  // Show a half-arc (progress gauge)
  const halfCirc = Math.PI * radius;
  const offset = halfCirc - (Math.min(100, Math.max(0, confidence)) / 100) * halfCirc;

  const color =
    confidence >= 70 ? '#16a34a' : confidence >= 40 ? '#d97706' : '#dc2626';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={96} height={56} viewBox="0 0 96 56">
        {/* Track arc */}
        <path
          d="M8,48 A40,40 0 0,1 88,48"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d="M8,48 A40,40 0 0,1 88,48"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={halfCirc}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <span className="text-2xl font-bold tabular-nums" style={{ color }}>
        {Math.round(confidence)}%
      </span>
      <span className="text-xs text-slate-500">Confidence</span>
    </div>
  );
}

export function SynthesisVerdict({
  verdict,
  confidence,
  executiveSummary,
  keyStrengths,
  keyRisks,
  conditions,
}: SynthesisVerdictProps) {
  const display = getVerdictDisplay(verdict);

  return (
    <div className={cn('rounded-2xl border-2 overflow-hidden', display.borderClass)}>
      {/* Hero verdict banner */}
      <div className={cn('px-6 py-5 flex items-center gap-5', display.bgClass)}>
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm shrink-0">
          {display.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn('inline-block px-4 py-1.5 rounded-full text-lg font-black tracking-widest mb-1', display.badgeBg, display.badgeText, 'bg-white/20')}>
            {display.label}
          </div>
          <p className="text-white/90 text-sm font-medium">Synthesis Verdict</p>
        </div>
        <div className="shrink-0">
          <ConfidenceArc confidence={confidence} />
        </div>
      </div>

      {/* Executive summary */}
      <div className="px-6 py-5 bg-white border-b border-slate-100">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Executive Summary
        </h3>
        <p className="text-slate-800 leading-relaxed">{executiveSummary}</p>
      </div>

      {/* Strengths + Risks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 bg-white">
        <div className="px-6 py-5 border-r border-b sm:border-b-0 border-slate-100">
          <h3 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Key Strengths
          </h3>
          <ul className="space-y-2">
            {keyStrengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5" />
            Key Risks
          </h3>
          <ul className="space-y-2">
            {keyRisks.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Conditions (if conditional) */}
      {conditions && conditions.length > 0 && (
        <div className="px-6 py-5 bg-amber-50 border-t border-amber-200">
          <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Conditions to Proceed
          </h3>
          <ul className="space-y-2">
            {conditions.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
