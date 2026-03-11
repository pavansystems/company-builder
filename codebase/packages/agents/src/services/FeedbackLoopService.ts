import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@company-builder/core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentErrorRate {
  agentName: string;
  totalRuns: number;
  failedRuns: number;
  errorRate: number;
  averageDurationMs: number | null;
}

export interface ThresholdSuggestion {
  phaseFrom: string;
  phaseTo: string;
  currentHighThreshold: number;
  currentLowThreshold: number;
  suggestedHighThreshold: number;
  suggestedLowThreshold: number;
  rationale: string;
  confidence: number;
}

export interface FeedbackSummary {
  analysisRunAt: string;
  lookbackDays: number;

  // Advancement rates
  phase0AdvancementRate: number | null;
  phase1AdvancementRate: number | null;
  phase2AdvancementRate: number | null;

  // Score separation (advanced items vs rejected items)
  phase0AdvancedAvgScore: number | null;
  phase0RejectedAvgScore: number | null;
  phase1AdvancedAvgScore: number | null;
  phase1RejectedAvgScore: number | null;

  // Agent reliability
  agentErrorRates: AgentErrorRate[];
  highestErrorRateAgent: string | null;

  // Threshold calibration
  thresholdSuggestions: ThresholdSuggestion[];

  // Concept volume stats
  totalConceptsAnalyzed: number;
  totalBlueprintsCompleted: number;

  // Manual override rate
  manualOverrideRate: number | null;

  // Timeout / stall analysis
  timeoutCountsByPhase: Record<string, number>;
  timeoutRate: number | null;
  timeoutThresholdSuggestions: string[];

  // Data quality
  dataPointsAvailable: number;
  sufficientDataForCalibration: boolean;
}

interface GateDecisionRow {
  gate_phase: string | null;
  decision: string;
  pre_decision_data: Record<string, unknown> | null;
}

interface AgentRunRow {
  agent_name: string;
  status: string;
  execution_duration_seconds: number | null;
}

interface StallEventRow {
  learning_for_phase: string | null;
  learning_detail: string | null;
  occurred_at: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * FeedbackLoopService
 *
 * Weekly aggregation service that analyzes pipeline outcomes to:
 * 1. Compute advancement rates across phases
 * 2. Measure gate threshold calibration quality
 * 3. Track agent error rates and performance
 * 4. Suggest threshold adjustments to improve quality
 * 5. Apply approved calibrations to gate_rules table
 *
 * This is a batch service, not real-time. It runs weekly via cron.
 */
export class FeedbackLoopService {
  constructor(private readonly supabase: SupabaseClient) {}

  // ---------------------------------------------------------------------------
  // aggregateOutcomes() — main analysis entry point
  // ---------------------------------------------------------------------------

  /**
   * Performs the weekly feedback loop analysis.
   *
   * Queries:
   * - user_annotations for manual overrides and human feedback
   * - feedback_events for system events
   * - gate_decisions for scoring and approval history
   * - agent_runs for performance metrics
   *
   * Returns a FeedbackSummary with calibration suggestions.
   */
  async aggregateOutcomes(lookbackDays = 30): Promise<FeedbackSummary> {
    logger.info('FeedbackLoopService: starting outcome aggregation', { lookbackDays });
    const analysisRunAt = new Date().toISOString();
    const lookbackCutoff = new Date(
      Date.now() - lookbackDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Run all queries in parallel for efficiency
    const [
      gateDecisionsResult,
      agentRunsResult,
      blueprintCountResult,
      annotationsResult,
      gateRulesResult,
      stallEventsResult,
    ] = await Promise.all([
      this.fetchGateDecisions(lookbackCutoff),
      this.fetchAgentRuns(lookbackCutoff),
      this.fetchBlueprintCount(lookbackCutoff),
      this.fetchManualAnnotations(lookbackCutoff),
      this.fetchCurrentGateRules(),
      this.fetchWatchdogStallEvents(lookbackCutoff),
    ]);

    const gateDecisions = gateDecisionsResult;
    const agentRuns = agentRunsResult;
    const blueprintCount = blueprintCountResult;
    const annotationCount = annotationsResult;
    const gateRules = gateRulesResult;
    const stallEvents = stallEventsResult;

    // -----------------------------------------------------------------------
    // Advancement rate analysis
    // -----------------------------------------------------------------------
    const phase0Decisions = gateDecisions.filter((d) => d.gate_phase === 'phase_0');
    const phase1Decisions = gateDecisions.filter((d) => d.gate_phase === 'phase_1');
    const phase2Decisions = gateDecisions.filter((d) => d.gate_phase === 'phase_2');

    const phase0AdvancementRate = this.computeAdvancementRate(phase0Decisions);
    const phase1AdvancementRate = this.computeAdvancementRate(phase1Decisions);
    const phase2AdvancementRate = this.computeAdvancementRate(phase2Decisions);

    // -----------------------------------------------------------------------
    // Score separation analysis (do higher-scoring items actually advance?)
    // -----------------------------------------------------------------------
    const { advancedAvg: phase0AdvancedAvgScore, rejectedAvg: phase0RejectedAvgScore } =
      this.computeScoreSeparation(phase0Decisions);
    const { advancedAvg: phase1AdvancedAvgScore, rejectedAvg: phase1RejectedAvgScore } =
      this.computeScoreSeparation(phase1Decisions);

    // -----------------------------------------------------------------------
    // Agent error rate analysis
    // -----------------------------------------------------------------------
    const agentErrorRates = this.computeAgentErrorRates(agentRuns);
    const highestErrorRateAgent = agentErrorRates.length > 0
      ? agentErrorRates.reduce((a, b) => (a.errorRate > b.errorRate ? a : b)).agentName
      : null;

    // -----------------------------------------------------------------------
    // Threshold calibration suggestions
    // -----------------------------------------------------------------------
    const thresholdSuggestions = this.computeThresholdSuggestions(
      gateDecisions,
      gateRules,
    );

    // -----------------------------------------------------------------------
    // Manual override rate
    // -----------------------------------------------------------------------
    const totalGateDecisions = gateDecisions.length;
    const manualOverrideRate = totalGateDecisions > 0
      ? Math.round((annotationCount / totalGateDecisions) * 100) / 100
      : null;

    // -----------------------------------------------------------------------
    // Timeout / stall analysis
    // -----------------------------------------------------------------------
    const { timeoutCountsByPhase, timeoutRate, timeoutThresholdSuggestions } =
      this.computeTimeoutAnalysis(stallEvents, agentRuns);

    // -----------------------------------------------------------------------
    // Data sufficiency check
    // -----------------------------------------------------------------------
    const dataPointsAvailable = gateDecisions.length;
    const sufficientDataForCalibration = dataPointsAvailable >= 20;

    const summary: FeedbackSummary = {
      analysisRunAt,
      lookbackDays,
      phase0AdvancementRate,
      phase1AdvancementRate,
      phase2AdvancementRate,
      phase0AdvancedAvgScore,
      phase0RejectedAvgScore,
      phase1AdvancedAvgScore,
      phase1RejectedAvgScore,
      agentErrorRates,
      highestErrorRateAgent,
      thresholdSuggestions,
      totalConceptsAnalyzed: phase1Decisions.length,
      totalBlueprintsCompleted: blueprintCount,
      manualOverrideRate,
      timeoutCountsByPhase,
      timeoutRate,
      timeoutThresholdSuggestions,
      dataPointsAvailable,
      sufficientDataForCalibration,
    };

    // Store the analysis result
    await this.storeFeedbackSummary(summary);

    logger.info('FeedbackLoopService: outcome aggregation complete', {
      dataPointsAvailable,
      sufficientDataForCalibration,
      thresholdSuggestions: thresholdSuggestions.length,
      agentErrorRates: agentErrorRates.length,
    });

    return summary;
  }

  // ---------------------------------------------------------------------------
  // applyCalibration() — update gate_rules with suggested thresholds
  // ---------------------------------------------------------------------------

  /**
   * Applies approved threshold calibration suggestions to the gate_rules table.
   *
   * Only applies suggestions with confidence >= 0.7 to prevent noise from
   * insufficient data from corrupting gate behavior.
   *
   * @param suggestions - Array of ThresholdSuggestion from aggregateOutcomes()
   */
  async applyCalibration(suggestions: ThresholdSuggestion[]): Promise<void> {
    const highConfidenceSuggestions = suggestions.filter(
      (s) => s.confidence >= 0.7,
    );

    if (highConfidenceSuggestions.length === 0) {
      logger.info('FeedbackLoopService: no high-confidence suggestions to apply');
      return;
    }

    logger.info('FeedbackLoopService: applying threshold calibrations', {
      count: highConfidenceSuggestions.length,
    });

    for (const suggestion of highConfidenceSuggestions) {
      const { error } = await this.supabase
        .from('gate_rules')
        .update({
          high_threshold: suggestion.suggestedHighThreshold,
          low_threshold: suggestion.suggestedLowThreshold,
          updated_at: new Date().toISOString(),
        })
        .eq('phase_from', suggestion.phaseFrom)
        .eq('phase_to', suggestion.phaseTo);

      if (error !== null) {
        logger.error('FeedbackLoopService: failed to update gate rule', {
          phaseFrom: suggestion.phaseFrom,
          phaseTo: suggestion.phaseTo,
          error: error.message,
        });
        continue;
      }

      logger.info('FeedbackLoopService: gate rule updated', {
        phaseFrom: suggestion.phaseFrom,
        phaseTo: suggestion.phaseTo,
        newHighThreshold: suggestion.suggestedHighThreshold,
        newLowThreshold: suggestion.suggestedLowThreshold,
        confidence: suggestion.confidence,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers — data fetching
  // ---------------------------------------------------------------------------

  private async fetchGateDecisions(since: string): Promise<GateDecisionRow[]> {
    const { data, error } = await this.supabase
      .from('gate_decisions')
      .select('gate_phase, decision, pre_decision_data')
      .gte('decided_at', since)
      .order('decided_at', { ascending: false });

    if (error !== null) {
      logger.warn('FeedbackLoopService: failed to fetch gate decisions', {
        error: error.message,
      });
      return [];
    }

    return (data ?? []) as GateDecisionRow[];
  }

  private async fetchAgentRuns(since: string): Promise<AgentRunRow[]> {
    const { data, error } = await this.supabase
      .from('agent_runs')
      .select('agent_name, status, execution_duration_seconds')
      .gte('started_at', since)
      .order('started_at', { ascending: false });

    if (error !== null) {
      logger.warn('FeedbackLoopService: failed to fetch agent runs', {
        error: error.message,
      });
      return [];
    }

    return (data ?? []) as AgentRunRow[];
  }

  private async fetchBlueprintCount(since: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('blueprints')
      .select('id', { count: 'exact', head: true })
      .eq('is_finalized', true)
      .gte('finalized_at', since);

    if (error !== null) {
      logger.warn('FeedbackLoopService: failed to fetch blueprint count', {
        error: error.message,
      });
      return 0;
    }

    return count ?? 0;
  }

  private async fetchManualAnnotations(since: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('user_annotations')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since);

    if (error !== null) {
      logger.warn('FeedbackLoopService: failed to fetch user annotations', {
        error: error.message,
      });
      return 0;
    }

    return count ?? 0;
  }

  private async fetchCurrentGateRules(): Promise<Array<{
    phase_from: string;
    phase_to: string;
    high_threshold: number;
    low_threshold: number;
  }>> {
    const { data, error } = await this.supabase
      .from('gate_rules')
      .select('phase_from, phase_to, high_threshold, low_threshold');

    if (error !== null) {
      logger.warn('FeedbackLoopService: failed to fetch gate rules', {
        error: error.message,
      });
      return [];
    }

    return (data ?? []) as Array<{
      phase_from: string;
      phase_to: string;
      high_threshold: number;
      low_threshold: number;
    }>;
  }

  private async fetchWatchdogStallEvents(since: string): Promise<StallEventRow[]> {
    const { data, error } = await this.supabase
      .from('feedback_events')
      .select('learning_for_phase, learning_detail, occurred_at')
      .eq('event_type', 'watchdog_stall')
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: false });

    if (error !== null) {
      logger.warn('FeedbackLoopService: failed to fetch watchdog stall events', {
        error: error.message,
      });
      return [];
    }

    return (data ?? []) as StallEventRow[];
  }

  // ---------------------------------------------------------------------------
  // Private helpers — analysis computation
  // ---------------------------------------------------------------------------

  private computeAdvancementRate(decisions: GateDecisionRow[]): number | null {
    if (decisions.length === 0) return null;

    const advanced = decisions.filter(
      (d) => d.decision === 'pass' || d.decision === 'override_pass',
    ).length;

    return Math.round((advanced / decisions.length) * 100) / 100;
  }

  private computeScoreSeparation(
    decisions: GateDecisionRow[],
  ): { advancedAvg: number | null; rejectedAvg: number | null } {
    const advanced = decisions.filter(
      (d) => d.decision === 'pass' || d.decision === 'override_pass',
    );
    const rejected = decisions.filter(
      (d) => d.decision === 'fail' || d.decision === 'override_fail',
    );

    const extractScore = (d: GateDecisionRow): number | null => {
      const preData = d.pre_decision_data;
      if (!preData) return null;
      const score = preData.score ?? preData.composite_score;
      return typeof score === 'number' ? score : null;
    };

    const advancedScores = advanced.map(extractScore).filter((s): s is number => s !== null);
    const rejectedScores = rejected.map(extractScore).filter((s): s is number => s !== null);

    const avg = (arr: number[]): number | null => {
      if (arr.length === 0) return null;
      return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
    };

    return {
      advancedAvg: avg(advancedScores),
      rejectedAvg: avg(rejectedScores),
    };
  }

  private computeAgentErrorRates(runs: AgentRunRow[]): AgentErrorRate[] {
    // Group by agent name
    const byAgent = new Map<string, AgentRunRow[]>();
    for (const run of runs) {
      const existing = byAgent.get(run.agent_name) ?? [];
      existing.push(run);
      byAgent.set(run.agent_name, existing);
    }

    const errorRates: AgentErrorRate[] = [];
    for (const [agentName, agentRuns] of byAgent.entries()) {
      const totalRuns = agentRuns.length;
      const failedRuns = agentRuns.filter((r) => r.status === 'failed').length;
      const errorRate = Math.round((failedRuns / totalRuns) * 100) / 100;

      const successRuns = agentRuns.filter(
        (r) => r.status === 'success' && r.execution_duration_seconds !== null,
      );
      const averageDurationMs =
        successRuns.length > 0
          ? Math.round(
              (successRuns.reduce(
                (sum, r) => sum + (r.execution_duration_seconds ?? 0),
                0,
              ) /
                successRuns.length) *
                1000,
            )
          : null;

      errorRates.push({
        agentName,
        totalRuns,
        failedRuns,
        errorRate,
        averageDurationMs,
      });
    }

    // Sort by error rate descending (worst performers first)
    return errorRates.sort((a, b) => b.errorRate - a.errorRate);
  }

  private computeThresholdSuggestions(
    decisions: GateDecisionRow[],
    currentRules: Array<{
      phase_from: string;
      phase_to: string;
      high_threshold: number;
      low_threshold: number;
    }>,
  ): ThresholdSuggestion[] {
    const suggestions: ThresholdSuggestion[] = [];

    for (const rule of currentRules) {
      const phaseDecisions = decisions.filter((d) => d.gate_phase === rule.phase_from);

      if (phaseDecisions.length < 20) {
        // Insufficient data — skip this phase
        continue;
      }

      const advancementRate = this.computeAdvancementRate(phaseDecisions) ?? 0;

      // Target advancement rate: 30-50% is healthy
      // Too high (> 70%): gate is too permissive — raise thresholds
      // Too low (< 15%): gate is too restrictive — lower thresholds
      const TARGET_HIGH = 0.5;
      const TARGET_LOW = 0.3;
      const TOO_PERMISSIVE = 0.7;
      const TOO_RESTRICTIVE = 0.15;

      let suggestedHighThreshold = rule.high_threshold;
      let suggestedLowThreshold = rule.low_threshold;
      let rationale = '';
      let confidence = 0.5;

      if (advancementRate > TOO_PERMISSIVE) {
        // Gate is too permissive — raise thresholds by 5-10 points
        const adjustment = Math.min(10, (advancementRate - TARGET_HIGH) * 50);
        suggestedHighThreshold = Math.min(95, rule.high_threshold + adjustment);
        suggestedLowThreshold = Math.min(
          suggestedHighThreshold - 15,
          rule.low_threshold + adjustment * 0.5,
        );
        rationale = `Gate too permissive: ${Math.round(advancementRate * 100)}% advancement rate (target: ${Math.round(TARGET_HIGH * 100)}%). Raising thresholds by ~${Math.round(adjustment)} points.`;
        confidence = Math.min(0.9, 0.5 + (advancementRate - TOO_PERMISSIVE) * 2);
      } else if (advancementRate < TOO_RESTRICTIVE) {
        // Gate is too restrictive — lower thresholds by 5-10 points
        const adjustment = Math.min(10, (TOO_RESTRICTIVE - advancementRate) * 50);
        suggestedHighThreshold = Math.max(50, rule.high_threshold - adjustment);
        suggestedLowThreshold = Math.max(
          10,
          Math.min(suggestedHighThreshold - 15, rule.low_threshold - adjustment * 0.5),
        );
        rationale = `Gate too restrictive: ${Math.round(advancementRate * 100)}% advancement rate (target: ${Math.round(TARGET_LOW * 100)}%). Lowering thresholds by ~${Math.round(adjustment)} points.`;
        confidence = Math.min(0.9, 0.5 + (TOO_RESTRICTIVE - advancementRate) * 2);
      } else {
        // Gate is well-calibrated — no change needed
        rationale = `Gate well-calibrated: ${Math.round(advancementRate * 100)}% advancement rate is within target range of ${Math.round(TARGET_LOW * 100)}-${Math.round(TARGET_HIGH * 100)}%.`;
        confidence = 0.9;
        // No suggestion needed if thresholds are already correct
        if (
          suggestedHighThreshold === rule.high_threshold &&
          suggestedLowThreshold === rule.low_threshold
        ) {
          continue;
        }
      }

      // Confidence boost for large sample sizes
      const sampleSizeBoost = Math.min(0.1, phaseDecisions.length / 200);
      confidence = Math.min(0.95, confidence + sampleSizeBoost);

      suggestions.push({
        phaseFrom: rule.phase_from,
        phaseTo: rule.phase_to,
        currentHighThreshold: rule.high_threshold,
        currentLowThreshold: rule.low_threshold,
        suggestedHighThreshold: Math.round(suggestedHighThreshold),
        suggestedLowThreshold: Math.round(suggestedLowThreshold),
        rationale,
        confidence: Math.round(confidence * 100) / 100,
      });
    }

    return suggestions;
  }

  /**
   * Computes timeout/stall analysis from watchdog_stall feedback events.
   *
   * - Counts timeouts per phase
   * - Computes timeout rate relative to total agent runs
   * - Suggests stall threshold adjustments if timeout rate exceeds 10%
   */
  private computeTimeoutAnalysis(
    stallEvents: StallEventRow[],
    agentRuns: AgentRunRow[],
  ): {
    timeoutCountsByPhase: Record<string, number>;
    timeoutRate: number | null;
    timeoutThresholdSuggestions: string[];
  } {
    // Count timeouts per phase
    const timeoutCountsByPhase: Record<string, number> = {};
    for (const event of stallEvents) {
      const phase = event.learning_for_phase ?? 'unknown';
      timeoutCountsByPhase[phase] = (timeoutCountsByPhase[phase] ?? 0) + 1;
    }

    // Compute overall timeout rate relative to total agent runs
    const totalRuns = agentRuns.length;
    const totalTimeouts = stallEvents.length;
    const timeoutRate = totalRuns > 0
      ? Math.round((totalTimeouts / totalRuns) * 100) / 100
      : null;

    // Generate suggestions if timeout rate exceeds threshold
    const TIMEOUT_RATE_THRESHOLD = 0.1; // 10%
    const timeoutThresholdSuggestions: string[] = [];

    if (timeoutRate !== null && timeoutRate > TIMEOUT_RATE_THRESHOLD) {
      timeoutThresholdSuggestions.push(
        `Overall timeout rate is ${Math.round(timeoutRate * 100)}% (threshold: ${Math.round(TIMEOUT_RATE_THRESHOLD * 100)}%). Consider increasing the watchdog stall threshold or investigating slow agents.`,
      );
    }

    // Per-phase suggestions: flag phases where timeouts are concentrated
    for (const [phase, count] of Object.entries(timeoutCountsByPhase)) {
      const phaseRuns = agentRuns.filter((r) => {
        // Map agent names to phases via known step lists is complex;
        // use a simpler heuristic: if > 5 timeouts in a phase, flag it
        return true;
      }).length;

      const phaseTimeoutRate = phaseRuns > 0
        ? count / phaseRuns
        : null;

      if (count >= 5 && phaseTimeoutRate !== null && phaseTimeoutRate > TIMEOUT_RATE_THRESHOLD) {
        timeoutThresholdSuggestions.push(
          `Phase "${phase}" has ${count} timeouts (${Math.round(phaseTimeoutRate * 100)}% of runs). Agents in this phase may need longer stall thresholds or performance investigation.`,
        );
      } else if (count >= 5) {
        timeoutThresholdSuggestions.push(
          `Phase "${phase}" has ${count} watchdog timeouts in the lookback period. Review agent performance in this phase.`,
        );
      }
    }

    return { timeoutCountsByPhase, timeoutRate, timeoutThresholdSuggestions };
  }

  // ---------------------------------------------------------------------------
  // Private helpers — persistence
  // ---------------------------------------------------------------------------

  private async storeFeedbackSummary(summary: FeedbackSummary): Promise<void> {
    // Store the summary as a feedback_event of type 'validation_passed'
    // (reusing the feedback_events table as the closest available schema)
    const { error } = await this.supabase.from('feedback_events').insert({
      event_type: 'validation_passed',
      outcome: 'feedback_loop_run',
      outcome_confidence: summary.sufficientDataForCalibration ? 0.9 : 0.4,
      learning_for_phase: null,
      learning_detail: JSON.stringify(summary),
      occurred_at: summary.analysisRunAt,
      recorded_at: summary.analysisRunAt,
    });

    if (error !== null) {
      // Non-fatal — log but don't throw
      logger.warn('FeedbackLoopService: failed to persist feedback summary', {
        error: error.message,
      });
    }
  }
}
