import type { SupabaseClient } from '@supabase/supabase-js';
import type { PipelineItem } from '@company-builder/types';
import { logger, type Logger } from '../utils/logger';

export class WatchdogTimer {
  private readonly log: Logger;

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly stallThresholdMs: number = 5 * 60 * 1000,
  ) {
    this.log = logger.child({ service: 'WatchdogTimer' });
  }

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
      this.log.error('Failed to query for stalled pipeline items', {
        error: error.message,
        stallCutoff,
      });
      throw new Error(`WatchdogTimer: failed to query stalled items — ${error.message}`);
    }

    const stalledItems = (data ?? []) as PipelineItem[];

    if (stalledItems.length > 0) {
      this.log.warn('Stalled pipeline items detected', {
        count: stalledItems.length,
        stallThresholdMs: this.stallThresholdMs,
        stallCutoff,
        itemIds: stalledItems.map((i) => i.id),
        phases: stalledItems.map((i) => i.current_phase),
        steps: stalledItems.map((i) => i.current_step),
      });
    }

    return stalledItems;
  }

  /**
   * Marks a pipeline item as blocked due to a stall and emits a feedback event
   * so the FeedbackLoopService can analyze timeout patterns.
   */
  async markAsBlocked(item: PipelineItem): Promise<void> {
    const { error } = await this.supabase
      .from('pipeline_items')
      .update({ status: 'blocked' })
      .eq('id', item.id);

    if (error !== null) {
      this.log.error('Failed to mark pipeline item as blocked', {
        itemId: item.id,
        error: error.message,
      });
      throw new Error(
        `WatchdogTimer: failed to mark item ${item.id} as blocked — ${error.message}`,
      );
    }

    this.log.info('Marked stalled pipeline item as blocked', { itemId: item.id });

    // Emit a feedback event so timeout patterns are tracked by FeedbackLoopService
    await this.emitStallFeedbackEvent(item);
  }

  /**
   * Creates a feedback_events record for a stalled item so the
   * FeedbackLoopService can aggregate timeout patterns per phase.
   */
  private async emitStallFeedbackEvent(item: PipelineItem): Promise<void> {
    const now = new Date().toISOString();
    const stalledDurationMs = item.entered_step_at
      ? Date.now() - new Date(item.entered_step_at).getTime()
      : null;

    const payload = {
      pipeline_item_id: item.id,
      agent_name: item.current_step,
      phase: item.current_phase,
      step: item.current_step,
      stalled_duration_ms: stalledDurationMs,
      stall_threshold_ms: this.stallThresholdMs,
      concept_id: item.concept_id ?? null,
      market_opportunity_id: item.market_opportunity_id ?? null,
    };

    const { error } = await this.supabase.from('feedback_events').insert({
      event_type: 'watchdog_stall',
      outcome: 'stall_blocked',
      outcome_confidence: null,
      learning_for_phase: item.current_phase,
      learning_detail: JSON.stringify(payload),
      occurred_at: item.entered_step_at ?? now,
      recorded_at: now,
    });

    if (error !== null) {
      // Non-fatal — log but don't throw so the blocking operation still succeeds
      this.log.warn('WatchdogTimer: failed to emit stall feedback event', {
        itemId: item.id,
        error: error.message,
      });
    } else {
      this.log.info('WatchdogTimer: stall feedback event emitted', {
        itemId: item.id,
        phase: item.current_phase,
        step: item.current_step,
      });
    }
  }
}
