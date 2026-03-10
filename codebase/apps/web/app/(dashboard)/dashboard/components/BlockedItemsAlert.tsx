'use client';

import { useState } from 'react';
import { AlertCircle, RotateCcw, X } from 'lucide-react';
import type { PipelineItem } from '@company-builder/types';
import { Button } from '@/components/ui/button';

interface BlockedItemsAlertProps {
  blockedItems: PipelineItem[];
}

const PHASE_LABELS: Record<string, string> = {
  phase_0: 'Discovery',
  phase_1: 'Ideation',
  phase_2: 'Validation',
  phase_3: 'Blueprint',
};

function getItemName(item: PipelineItem): string {
  if (item.market_opportunity_id) {
    return `Opportunity ${item.market_opportunity_id.slice(0, 8)}…`;
  }
  if (item.concept_id) {
    return `Concept ${item.concept_id.slice(0, 8)}…`;
  }
  return `Item ${item.id.slice(0, 8)}…`;
}

function getBlockedReason(item: PipelineItem): string {
  if (item.last_gate_reason) return item.last_gate_reason;
  if (item.current_step) return `Stuck at: ${item.current_step}`;
  return 'Awaiting review';
}

export function BlockedItemsAlert({ blockedItems }: BlockedItemsAlertProps) {
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState(false);

  if (blockedItems.length === 0 || dismissed) return null;

  async function handleRetry(itemId: string) {
    setRetrying((prev) => ({ ...prev, [itemId]: true }));
    try {
      await fetch(`/api/pipeline/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      });
    } catch {
      // Silently handle — user can retry again
    } finally {
      setRetrying((prev) => ({ ...prev, [itemId]: false }));
    }
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-orange-100/70 border-b border-orange-200">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-600 shrink-0" />
          <span className="text-sm font-semibold text-orange-900">
            {blockedItems.length} item{blockedItems.length !== 1 ? 's' : ''} need attention
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-orange-400 hover:text-orange-600 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Blocked item list */}
      <div className="divide-y divide-orange-100">
        {blockedItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 px-4 py-2.5"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {getItemName(item)}
                </span>
                {item.current_phase && (
                  <span className="text-xs text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded font-medium">
                    {PHASE_LABELS[item.current_phase] ?? item.current_phase}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{getBlockedReason(item)}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 h-7 px-2.5 text-xs border-orange-300 text-orange-700 hover:bg-orange-100 hover:border-orange-400"
              disabled={retrying[item.id]}
              onClick={() => handleRetry(item.id)}
            >
              {retrying[item.id] ? (
                <RotateCcw className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Retry
                </>
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
