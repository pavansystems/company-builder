'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GateRule, GateType } from '@company-builder/types';

interface ThresholdEditorProps {
  gateRules: GateRule[];
}

const GATE_TYPE_OPTIONS: { value: GateType; label: string }[] = [
  { value: 'automatic', label: 'Automatic' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'manual', label: 'Manual' },
];

const PHASE_LABELS: Record<string, string> = {
  '0→1': 'Phase 0 → Phase 1 (Discovery → Ideation)',
  '1→2': 'Phase 1 → Phase 2 (Ideation → Validation)',
  '2→3': 'Phase 2 → Phase 3 (Validation → Blueprint)',
  phase_0: 'Phase 0 → Phase 1',
  phase_1: 'Phase 1 → Phase 2',
  phase_2: 'Phase 2 → Phase 3',
};

interface EditableRule extends GateRule {
  _changed?: boolean;
}

function RangeSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  color,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  color?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-600">{label}</label>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          title={label}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!isNaN(n) && n >= min && n <= max) onChange(n);
          }}
          className="w-14 text-sm font-bold text-slate-900 tabular-nums text-right border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-violet-400"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color ?? '#7C3AED'} 0%, ${color ?? '#7C3AED'} ${value}%, #e2e8f0 ${value}%, #e2e8f0 100%)`,
        }}
      />
    </div>
  );
}

function BandPreview({ high, low }: { high: number; low: number }) {
  return (
    <div className="flex gap-1.5 items-center flex-wrap">
      <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold bg-green-100 text-green-700">
        ≥{high}: Auto-Advance
      </span>
      <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
        {low}–{high - 1}: Review
      </span>
      <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold bg-red-100 text-red-700">
        &lt;{low}: Auto-Reject
      </span>
    </div>
  );
}

export function ThresholdEditor({ gateRules }: ThresholdEditorProps) {
  const [rules, setRules] = useState<EditableRule[]>(gateRules.map((r) => ({ ...r })));
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<string | null>(null);

  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  }

  function updateRule(id: string, updates: Partial<GateRule>) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates, _changed: true } : r))
    );
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function saveRule(rule: EditableRule) {
    setSaving(rule.id);
    setErrors((prev) => ({ ...prev, [rule.id]: '' }));
    try {
      const res = await fetch('/api/settings/gate-rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rule.id,
          gate_type: rule.gate_type,
          high_threshold: rule.high_threshold,
          low_threshold: rule.low_threshold,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Save failed');
      }
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, _changed: false } : r)));
      setSavedIds((prev) => new Set(prev).add(rule.id));
      const label =
        PHASE_LABELS[`${rule.phase_from}→${rule.phase_to}`] ??
        PHASE_LABELS[rule.phase_from] ??
        `${rule.phase_from} → ${rule.phase_to}`;
      showFeedback(`${label} saved successfully.`);
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        [rule.id]: e instanceof Error ? e.message : 'Error saving',
      }));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Feedback toast */}
      {feedback && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 shadow-lg">
          {feedback}
        </div>
      )}

      {rules.map((rule) => {
        const phaseLabel =
          PHASE_LABELS[`${rule.phase_from}→${rule.phase_to}`] ??
          PHASE_LABELS[rule.phase_from] ??
          `${rule.phase_from} → ${rule.phase_to}`;

        return (
          <div
            key={rule.id}
            className={cn(
              'rounded-xl border p-5 space-y-5 bg-white transition-all',
              rule._changed ? 'border-violet-300 shadow-sm' : 'border-slate-200'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{phaseLabel}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Gate Rule ID: {rule.id}</p>
              </div>
              {savedIds.has(rule.id) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                  Saved
                </span>
              )}
            </div>

            {/* Gate type */}
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Gate Type
              </p>
              <div className="flex gap-2">
                {GATE_TYPE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => updateRule(rule.id, { gate_type: value })}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                      rule.gate_type === value
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Threshold sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <RangeSlider
                label="High Threshold (Auto-Advance)"
                value={rule.high_threshold}
                onChange={(v) => updateRule(rule.id, { high_threshold: Math.max(rule.low_threshold + 1, v) })}
                color="#16a34a"
              />
              <RangeSlider
                label="Low Threshold (Auto-Reject)"
                value={rule.low_threshold}
                onChange={(v) => updateRule(rule.id, { low_threshold: Math.min(rule.high_threshold - 1, v) })}
                color="#dc2626"
              />
            </div>

            {/* Band preview */}
            <BandPreview high={rule.high_threshold} low={rule.low_threshold} />

            {/* Error */}
            {errors[rule.id] && (
              <p className="text-xs text-red-600">{errors[rule.id]}</p>
            )}

            {/* Save button */}
            {rule._changed && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-white text-xs"
                  onClick={() => saveRule(rule)}
                  disabled={saving === rule.id}
                >
                  {saving === rule.id ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
