'use client';

import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeSubscriptionOptions<T> {
  event?: PostgresChangeEvent;
  filter?: string; // e.g. 'current_phase=eq.phase_0'
  schema?: string;
  onInsert?: (payload: T) => void;
  onUpdate?: (payload: T) => void;
  onDelete?: (payload: T) => void;
}

/**
 * Subscribe to Supabase Realtime postgres_changes on a given table.
 * Automatically creates the channel on mount and cleans up on unmount.
 */
export function useRealtimeSubscription<T = Record<string, unknown>>(
  table: string,
  options: UseRealtimeSubscriptionOptions<T> = {}
): void {
  const {
    event = '*',
    filter,
    schema = 'public',
    onInsert,
    onUpdate,
    onDelete,
  } = options;

  // Store callbacks in refs so the subscription doesn't re-create on every render
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);

  onInsertRef.current = onInsert;
  onUpdateRef.current = onUpdate;
  onDeleteRef.current = onDelete;

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const channelName = `realtime_${table}_${filter ?? 'all'}_${Date.now()}`;

    const pgChangesConfig: {
      event: PostgresChangeEvent;
      schema: string;
      table: string;
      filter?: string;
    } = { event, schema, table };

    if (filter) {
      pgChangesConfig.filter = filter;
    }

    const channel: RealtimeChannel = supabase
      .channel(channelName)
      .on('postgres_changes', pgChangesConfig, (payload) => {
        if (payload.eventType === 'INSERT' && onInsertRef.current) {
          onInsertRef.current(payload.new as T);
        }
        if (payload.eventType === 'UPDATE' && onUpdateRef.current) {
          onUpdateRef.current(payload.new as T);
        }
        if (payload.eventType === 'DELETE' && onDeleteRef.current) {
          onDeleteRef.current(payload.old as T);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, filter, schema]);
}
