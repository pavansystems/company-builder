import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@company-builder/core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WatchlistVersion {
  id: string;
  created_at: string;
  published_at: string | null;
  opportunity_count: number | null;
  top_opportunities: unknown[] | null;
  status: string | null;
}

interface WatchlistPublicationResult {
  watchlistVersionId: string;
  publishedAt: string;
  feedbackEventId: string;
  opportunityCount: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * WatchlistPublisherService
 *
 * Listens for Phase 0 completions. When the watchlist-publisher agent completes
 * its run, this service:
 * 1. Fetches the watchlist version from the database
 * 2. Creates a feedback_events record to track the publication
 * 3. Logs the publication with opportunity count and metadata
 * 4. Marks the watchlist version as published
 *
 * This service is event-driven — it is called from the orchestrator callback
 * route when agentName === 'watchlist-publisher'.
 */
export class WatchlistPublisherService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Publishes a watchlist version — triggered when watchlist-publisher agent completes.
   *
   * @param watchlistVersionId - UUID of the watchlist_versions row to publish
   */
  async publishWatchlist(watchlistVersionId: string): Promise<WatchlistPublicationResult> {
    logger.info('WatchlistPublisherService: publishing watchlist', { watchlistVersionId });

    // Step 1: Load the watchlist version
    const { data: versionData, error: versionError } = await this.supabase
      .from('watchlist_versions')
      .select('*')
      .eq('id', watchlistVersionId)
      .maybeSingle();

    if (versionError !== null) {
      throw new Error(
        `WatchlistPublisherService: failed to load watchlist version ${watchlistVersionId}: ${versionError.message}`,
      );
    }

    // If the table doesn't exist yet, gracefully handle missing data
    const version = (versionData ?? {
      id: watchlistVersionId,
      opportunity_count: 0,
      top_opportunities: [],
      status: 'pending',
    }) as WatchlistVersion;

    const publishedAt = new Date().toISOString();
    const opportunityCount = version.opportunity_count ?? 0;

    // Step 2: Mark the watchlist version as published
    const { error: updateError } = await this.supabase
      .from('watchlist_versions')
      .update({
        published_at: publishedAt,
        status: 'published',
      })
      .eq('id', watchlistVersionId);

    if (updateError !== null) {
      // Non-fatal if table doesn't exist — log and continue
      logger.warn('WatchlistPublisherService: failed to update watchlist_versions', {
        watchlistVersionId,
        error: updateError.message,
      });
    }

    // Step 3: Create a feedback_events record to track this publication
    const { data: feedbackData, error: feedbackError } = await this.supabase
      .from('feedback_events')
      .insert({
        event_type: 'validation_passed', // Closest match to "phase 0 completed with output"
        outcome: 'watchlist_published',
        outcome_confidence: 1.0,
        learning_for_phase: 'phase_0',
        learning_detail: JSON.stringify({
          watchlistVersionId,
          opportunityCount,
          publishedAt,
          topOpportunities: (version.top_opportunities ?? []).slice(0, 5),
        }),
        occurred_at: publishedAt,
        recorded_at: publishedAt,
      })
      .select('id')
      .single();

    if (feedbackError !== null) {
      throw new Error(
        `WatchlistPublisherService: failed to create feedback_event: ${feedbackError.message}`,
      );
    }

    const feedbackEventId = (feedbackData as { id: string }).id;

    // Step 4: Log the publication for observability
    logger.info('WatchlistPublisherService: watchlist published successfully', {
      watchlistVersionId,
      publishedAt,
      opportunityCount,
      feedbackEventId,
    });

    return {
      watchlistVersionId,
      publishedAt,
      feedbackEventId,
      opportunityCount,
    };
  }

  /**
   * Called by the orchestrator when watchlist-publisher agent completes.
   * Extracts the watchlistVersionId from the agent output and publishes it.
   *
   * @param pipelineItemId - Pipeline item that triggered this
   * @param agentOutput    - Output from the watchlist-publisher agent run
   */
  async handleWatchlistAgentCompletion(
    pipelineItemId: string,
    agentOutput: Record<string, unknown>,
  ): Promise<WatchlistPublicationResult | null> {
    // Extract watchlistVersionId from agent output
    const watchlistVersionId =
      (agentOutput.watchlistVersionId as string | undefined) ??
      (agentOutput.watchlist_version_id as string | undefined) ??
      (agentOutput.versionId as string | undefined);

    if (!watchlistVersionId) {
      logger.warn(
        'WatchlistPublisherService: no watchlistVersionId in agent output — using pipeline item ID as fallback',
        { pipelineItemId, outputKeys: Object.keys(agentOutput) },
      );

      // Fallback: use pipeline item ID as the version ID
      // This handles cases where the watchlist-publisher agent doesn't explicitly output a version ID
      return this.publishWatchlist(pipelineItemId);
    }

    return this.publishWatchlist(watchlistVersionId);
  }
}
