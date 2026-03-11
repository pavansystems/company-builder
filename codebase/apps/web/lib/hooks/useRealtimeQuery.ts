'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeQueryOptions {
  event?: PostgresChangeEvent;
  filter?: string; // e.g. 'current_phase=eq.phase_0'
  schema?: string;
  enabled?: boolean;
}

interface UseRealtimeQueryReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Combines an initial data fetch with a Supabase Realtime subscription.
 * When a postgres_change is detected on the given table, the fetch function
 * is automatically re-invoked to refresh the data.
 */
export function useRealtimeQuery<T>(
  table: string,
  fetchFn: () => Promise<T>,
  options: UseRealtimeQueryOptions = {}
): UseRealtimeQueryReturn<T> {
  const {
    event = '*',
    filter,
    schema = 'public',
    enabled = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Stable ref for the fetch function so subscription doesn't re-create
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchFnRef.current();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const result = await fetchFnRef.current();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Realtime subscription — re-fetches on any matching change
  useEffect(() => {
    if (!enabled) return;

    const supabase = createBrowserSupabaseClient();
    const channelName = `realtime_query_${table}_${filter ?? 'all'}_${Date.now()}`;

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
      .on('postgres_changes', pgChangesConfig, () => {
        // Re-fetch data on any change
        refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, filter, schema, enabled, refresh]);

  return { data, loading, error, refresh };
}
