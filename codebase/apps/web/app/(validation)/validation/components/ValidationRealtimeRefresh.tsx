'use client';

import { useRouter } from 'next/navigation';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';

/**
 * Invisible client component that subscribes to agent_runs and gate_decisions
 * for live validation progress updates. Triggers a server-side re-fetch via
 * router.refresh() when changes are detected.
 */
export function ValidationRealtimeRefresh() {
  const router = useRouter();

  // Subscribe to agent_runs for live validation agent progress
  useRealtimeSubscription('agent_runs', {
    event: '*',
    onInsert: () => router.refresh(),
    onUpdate: () => router.refresh(),
  });

  // Subscribe to gate_decisions for verdict changes
  useRealtimeSubscription('gate_decisions', {
    event: '*',
    onInsert: () => router.refresh(),
    onUpdate: () => router.refresh(),
  });

  return null;
}
