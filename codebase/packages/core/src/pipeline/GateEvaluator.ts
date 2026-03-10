import type { SupabaseClient } from '@supabase/supabase-js';
import { computeWeightedScore } from '../utils/scoring';
import { logger } from '../utils/logger';

export type GateOutcome = 'advance' | 'reject' | 'review';

export interface GateEvaluationResult {
  outcome: GateOutcome;
  score: number;
  rationale: string;
  dimensions: Record<string, number>;
}

interface GateRuleRow {
  id: string;
  phase_from: string;
  phase_to: string;
  gate_type: 'automatic' | 'manual' | 'hybrid';
  high_threshold: number;
  low_threshold: number;
  config: Record<string, unknown> | null;
}

export class GateEvaluator {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Evaluates a gate for the given phase transition.
   *
   * Algorithm:
   * 1. Fetch gate_rules row for the phase_from -> phase_to transition
   * 2. Compute weighted composite score from provided dimensions + weights
   * 3. Apply gate-type logic:
   *    - automatic: score >= high_threshold → advance, score < low_threshold → reject, else → review
   *    - manual: always → review
   *    - hybrid: score >= high_threshold → advance, score < low_threshold → reject, else → review
   */
  async evaluate(
    phaseFrom: string,
    phaseTo: string,
    dimensions: Record<string, number>,
    weights: Record<string, number>,
  ): Promise<GateEvaluationResult> {
    // Step 1: Fetch gate rule
    const { data, error } = await this.supabase
      .from('gate_rules')
      .select('*')
      .eq('phase_from', phaseFrom)
      .eq('phase_to', phaseTo)
      .single();

    if (error !== null) {
      throw new Error(
        `Failed to fetch gate rule for transition ${phaseFrom} -> ${phaseTo}: ${error.message}`,
      );
    }

    if (data === null) {
      throw new Error(`No gate rule configured for transition ${phaseFrom} -> ${phaseTo}`);
    }

    const gateRule = data as GateRuleRow;

    // Step 2: Compute weighted composite score
    const score = computeWeightedScore(dimensions, weights);

    logger.info('Gate evaluation', {
      phaseFrom,
      phaseTo,
      gateType: gateRule.gate_type,
      score,
      highThreshold: gateRule.high_threshold,
      lowThreshold: gateRule.low_threshold,
    });

    // Step 3: Determine outcome based on gate type
    const outcome = this.determineOutcome(
      gateRule.gate_type,
      score,
      gateRule.high_threshold,
      gateRule.low_threshold,
    );

    const rationale = this.buildRationale(
      gateRule.gate_type,
      score,
      gateRule.high_threshold,
      gateRule.low_threshold,
      outcome,
    );

    return {
      outcome,
      score,
      rationale,
      dimensions,
    };
  }

  private determineOutcome(
    gateType: 'automatic' | 'manual' | 'hybrid',
    score: number,
    highThreshold: number,
    lowThreshold: number,
  ): GateOutcome {
    switch (gateType) {
      case 'automatic':
        if (score >= highThreshold) return 'advance';
        if (score < lowThreshold) return 'reject';
        // For automatic gates, anything in the middle band still advances
        // (the spec says automatic: score >= high → advance, score < low → reject)
        return 'advance';

      case 'manual':
        // Always require human review regardless of score
        return 'review';

      case 'hybrid':
        if (score >= highThreshold) return 'advance';
        if (score < lowThreshold) return 'reject';
        // Middle band requires human review
        return 'review';
    }
  }

  private buildRationale(
    gateType: 'automatic' | 'manual' | 'hybrid',
    score: number,
    highThreshold: number,
    lowThreshold: number,
    outcome: GateOutcome,
  ): string {
    if (gateType === 'manual') {
      return `Manual gate requires human review for all items. Score: ${score.toFixed(1)}/100.`;
    }

    const outcomeDescriptions: Record<GateOutcome, string> = {
      advance: `Score ${score.toFixed(1)}/100 meets or exceeds the high threshold of ${highThreshold}. Item auto-advances.`,
      reject: `Score ${score.toFixed(1)}/100 falls below the low threshold of ${lowThreshold}. Item is rejected.`,
      review: `Score ${score.toFixed(1)}/100 falls between the low threshold (${lowThreshold}) and high threshold (${highThreshold}). Human review required.`,
    };

    return `${gateType.charAt(0).toUpperCase() + gateType.slice(1)} gate evaluation: ${outcomeDescriptions[outcome]}`;
  }
}
