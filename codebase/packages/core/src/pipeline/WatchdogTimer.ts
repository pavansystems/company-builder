import type { SupabaseClient } from '@supabase/supabase-js';
import type { PipelineItem } from '@company-builder/types';
import { logger } from '../utils/logger';

export class WatchdogTimer {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly stallThresholdMs: number = 5 * 60 * 1000,
  ) {}

  /**
   * Queries for pipeline items that are in_progress but have not been updated
   * within the stall threshold window. These items are considered stalled.
   */
  async checkForStalledItems(): Promise<PipelineItem[]> {
    const stallCutoff = new Date(Date.now() - this.stallThresholdMs).toISOString();

    const { data, error } = await this.supabase
      .from('pipeline_items')
      .select('*')
      .eq('status', 'in_progress')
      .lt('entered_step_at', stallCutoff);

    if (error !== null) {
      logger.error('Failed to query for stalled pipeline items', {
        error: error.message,
        stallCutoff,
      });
      throw new Error(`WatchdogTimer: failed to query stalled items — ${error.message}`);
    }

    const stalledItems = (data ?? []) as PipelineItem[];

    if (stalledItems.length > 0) {
      logger.warn('Stalled pipeline items detected', {
        count: stalledItems.length,
        stallThresholdMs: this.stallThresholdMs,
        stallCutoff,
      });
    }

    return stalledItems;
  }

  /**
   * Marks a pipeline item as blocked due to a stall.
   */
  async markAsBlocked(itemId: string): Promise<void> {
    const { error } = await this.supabase
      .from('pipeline_items')
      .update({ status: 'blocked' })
      .eq('id', itemId);

    if (error !== null) {
      logger.error('Failed to mark pipeline item as blocked', {
        itemId,
        error: error.message,
      });
      throw new Error(
        `WatchdogTimer: failed to mark item ${itemId} as blocked — ${error.message}`,
      );
    }

    logger.info('Marked stalled pipeline item as blocked', { itemId });
  }
}
