'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface GateDecisionFormProps {
  itemId: string;
}

export function GateDecisionForm({ itemId }: GateDecisionFormProps) {
  const router = useRouter();
  const [rationale, setRationale] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleDecision(action: 'approve' | 'reject') {
    if (!rationale.trim()) {
      setError('Please provide a rationale for your decision.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/pipeline/items/${itemId}/gate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: rationale.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Failed to submit decision');
      }

      setSuccess(
        action === 'approve'
          ? 'Item approved and advanced to the next phase.'
          : 'Item rejected. It has been marked as failed.'
      );

      // Redirect back to queue after a brief delay
      setTimeout(() => {
        router.push('/review');
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Gate Decision</h3>
      <p className="text-sm text-slate-500">
        Review the information above and make a decision. A rationale is required.
      </p>

      <div className="space-y-2">
        <Label htmlFor="rationale" className="text-sm font-medium text-slate-700">
          Decision Rationale
        </Label>
        <Textarea
          id="rationale"
          placeholder="Explain why you are approving or rejecting this item..."
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={4}
          className="resize-none"
          disabled={isSubmitting || !!success}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={() => handleDecision('approve')}
          disabled={isSubmitting || !!success}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          Approve & Advance
        </Button>
        <Button
          onClick={() => handleDecision('reject')}
          disabled={isSubmitting || !!success}
          variant="destructive"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4 mr-2" />
          )}
          Reject
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push('/review')}
          disabled={isSubmitting}
          className="ml-auto"
        >
          Back to Queue
        </Button>
      </div>
    </div>
  );
}
