'use client';

import { useState } from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ScoreCard } from '@/components/shared/ScoreCard';
import { cn } from '@/lib/utils';
import type { Concept, ConceptScore } from '@company-builder/types';

interface ConceptReviewPanelProps {
  concept: Concept;
  score: ConceptScore | null;
  pipelineItemId: string;
}

type ReviewAction = 'approve' | 'hold' | 'reject';

function getRecommendation(score: number | null): {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
} {
  const s = score ?? 0;
  if (s >= 70) {
    return {
      label: 'Auto-Advance Recommended',
      description: 'Score exceeds the high threshold. This concept is recommended for validation.',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    };
  }
  if (s >= 40) {
    return {
      label: 'Manual Review Required',
      description: 'Score is in the review band. A human reviewer should evaluate this concept.',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
    };
  }
  return {
    label: 'Auto-Reject Recommended',
    description: 'Score is below the minimum threshold. This concept is unlikely to progress.',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: <XCircle className="h-5 w-5 text-red-500" />,
  };
}

export function ConceptReviewPanel({ concept, score, pipelineItemId }: ConceptReviewPanelProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState<ReviewAction | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const composite = score?.composite_score ?? null;
  const recommendation = getRecommendation(composite);

  async function handleAction(action: ReviewAction) {
    setLoading(action);
    setError(null);
    try {
      const apiAction =
        action === 'approve' ? 'advance' : action === 'reject' ? 'reject' : 'hold';

      const res = await fetch(`/api/pipeline/items/${pipelineItemId}/gate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: apiAction, notes }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Request failed');
      }

      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred.');
    } finally {
      setLoading(null);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-green-800">Decision Recorded</h3>
        <p className="text-sm text-green-600 mt-1">
          Your gate decision has been submitted and the pipeline will be updated.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score summary */}
      <div className="flex items-center gap-6 p-5 rounded-xl bg-slate-50 border border-slate-200">
        <div className="shrink-0">
          <ScoreCard
            score={composite ?? 0}
            label="Composite"
            size="lg"
            showBand
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900">{concept.title}</h3>
          {concept.summary && (
            <p className="text-sm text-slate-500 italic mt-0.5 line-clamp-2">{concept.summary}</p>
          )}
          {concept.target_customer_segment && (
            <p className="text-xs text-slate-500 mt-2">
              <span className="font-semibold">Target:</span>{' '}
              {concept.target_customer_segment}
            </p>
          )}
        </div>
      </div>

      {/* Recommendation badge */}
      <div
        className={cn(
          'flex items-start gap-3 rounded-xl border p-4',
          recommendation.bgColor,
          recommendation.borderColor
        )}
      >
        <div className="shrink-0 mt-0.5">{recommendation.icon}</div>
        <div>
          <p className={cn('font-semibold text-sm', recommendation.color)}>
            {recommendation.label}
          </p>
          <p className={cn('text-xs mt-0.5', recommendation.color, 'opacity-80')}>
            {recommendation.description}
          </p>
        </div>
      </div>

      {/* Reviewer notes */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">Reviewer Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add context, caveats, or reasoning for your decision..."
          rows={4}
          className="text-sm resize-none"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
          onClick={() => handleAction('approve')}
          disabled={loading !== null}
        >
          <CheckCircle className="h-4 w-4" />
          {loading === 'approve' ? 'Approving...' : 'Approve for Validation'}
        </Button>

        <Button
          variant="outline"
          className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 gap-2"
          onClick={() => handleAction('hold')}
          disabled={loading !== null}
        >
          <Clock className="h-4 w-4" />
          {loading === 'hold' ? 'Saving...' : 'Hold for Review'}
        </Button>

        <Button
          variant="outline"
          className="flex-1 border-red-300 text-red-700 hover:bg-red-50 gap-2"
          onClick={() => setShowRejectConfirm(true)}
          disabled={loading !== null}
        >
          <XCircle className="h-4 w-4" />
          {loading === 'reject' ? 'Rejecting...' : 'Reject'}
        </Button>
      </div>

      <ConfirmDialog
        open={showRejectConfirm}
        title="Reject Concept"
        description={`Are you sure you want to reject "${concept.title}"? This concept will be archived and removed from active evaluation.`}
        confirmLabel="Reject Concept"
        variant="destructive"
        onConfirm={() => {
          setShowRejectConfirm(false);
          handleAction('reject');
        }}
        onCancel={() => setShowRejectConfirm(false)}
      />
    </div>
  );
}
