'use client';

import { useRouter } from 'next/navigation';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';

/**
 * Invisible client component that subscribes to pipeline_items and agent_runs
 * changes. When a change is detected, it calls router.refresh() to re-fetch
 * the server component data without a full page reload.
 */
export function DashboardRealtimeRefresh() {
  const router = useRouter();

  // Refresh dashboard when pipeline items change (metrics, funnel, active items)
  useRealtimeSubscription('pipeline_items', {
    event: '*',
    onInsert: () => router.refresh(),
    onUpdate: () => router.refresh(),
    onDelete: () => router.refresh(),
  });

  // Refresh dashboard when agent runs change (cost metrics)
  useRealtimeSubscription('agent_runs', {
    event: '*',
    onInsert: () => router.refresh(),
    onUpdate: () => router.refresh(),
  });

  return null;
}
