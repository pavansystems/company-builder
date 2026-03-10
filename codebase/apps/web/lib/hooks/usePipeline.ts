'use client';

import { useEffect, useState } from 'react';
import type { PipelineItem } from '@company-builder/types';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

interface UsePipelineReturn {
  items: PipelineItem[];
  isLoading: boolean;
}

export function usePipeline(): UsePipelineReturn {
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    // Initial fetch
    supabase
      .from('pipeline_items')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems((data ?? []) as PipelineItem[]);
        setIsLoading(false);
      });

    // Subscribe to realtime changes
    const channel = supabase
      .channel('pipeline_items_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipeline_items' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setItems((prev) => [payload.new as PipelineItem, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setItems((prev) =>
              prev.map((item) =>
                item.id === (payload.new as PipelineItem).id
                  ? (payload.new as PipelineItem)
                  : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setItems((prev) =>
              prev.filter(
                (item) => item.id !== (payload.old as { id: string }).id
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { items, isLoading };
}
