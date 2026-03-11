'use client';

import { useRouter } from 'next/navigation';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';

/**
 * Invisible client component that subscribes to pipeline_items in the
 * blueprint phase (phase_3). Triggers a server-side re-fetch via
 * router.refresh() when blueprints are added, updated, or removed.
 */
export function BlueprintRealtimeRefresh() {
  const router = useRouter();

  // Subscribe to pipeline_items changes in blueprint phase (phase_3)
  useRealtimeSubscription('pipeline_items', {
    event: '*',
    filter: 'current_phase=eq.phase_3',
    onInsert: () => router.refresh(),
    onUpdate: () => router.refresh(),
    onDelete: () => router.refresh(),
  });

  // Subscribe to gate_decisions for blueprint finalization verdicts
  useRealtimeSubscription('gate_decisions', {
    event: 'INSERT',
    onInsert: () => router.refresh(),
  });

  return null;
}
