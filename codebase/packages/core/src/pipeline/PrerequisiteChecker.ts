import type { SupabaseClient } from '@supabase/supabase-js';
import type { PipelineItem, PipelinePhase } from '@company-builder/types';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// PrerequisiteChecker
// Validates that all required outputs from the previous phase exist before
// allowing a pipeline item to advance to a new phase.
// ---------------------------------------------------------------------------

export interface PrerequisiteResult {
  satisfied: boolean;
  missing: string[];
}

/**
 * Defines the checks that must pass before entering each phase.
 * Each checker function queries the database to verify required records exist.
 */
export class PrerequisiteChecker {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Checks whether the prerequisites for entering `targetPhase` are met
   * for the given pipeline item.
   *
   * Returns { satisfied: true, missing: [] } when all checks pass, or
   * { satisfied: false, missing: [...descriptions] } when something is missing.
   */
  async checkPrerequisites(
    item: PipelineItem,
    targetPhase: PipelinePhase,
  ): Promise<PrerequisiteResult> {
    const missing: string[] = [];

    switch (targetPhase) {
      case 'phase_1':
        await this.checkPhase1Prerequisites(item, missing);
        break;
      case 'phase_2':
        await this.checkPhase2Prerequisites(item, missing);
        break;
      case 'phase_3':
        await this.checkPhase3Prerequisites(item, missing);
        break;
      default:
        // phase_0 and archived have no prerequisites
        break;
    }

    const satisfied = missing.length === 0;

    if (!satisfied) {
      logger.warn('Prerequisites not met for phase transition', {
        itemId: item.id,
        targetPhase,
        missing,
      });
    }

    return { satisfied, missing };
  }

  // ---------------------------------------------------------------------------
  // Phase 1 (Ideation) requires:
  //   - A market_opportunity record with at least one score
  //   - At least one signal linked to the opportunity
  // ---------------------------------------------------------------------------

  private async checkPhase1Prerequisites(
    item: PipelineItem,
    missing: string[],
  ): Promise<void> {
    const opportunityId = item.market_opportunity_id;

    if (!opportunityId) {
      missing.push('Pipeline item has no linked market_opportunity_id');
      return;
    }

    // Check market_opportunity record exists
    const { data: opportunity, error: oppError } = await this.supabase
      .from('market_opportunities')
      .select('id')
      .eq('id', opportunityId)
      .maybeSingle();

    if (oppError !== null) {
      logger.warn('PrerequisiteChecker: failed to query market_opportunities', {
        error: oppError.message,
      });
      missing.push('Unable to verify market opportunity record (query error)');
      return;
    }

    if (opportunity === null) {
      missing.push('Market opportunity record does not exist');
      return;
    }

    // Check that at least one opportunity score exists
    const { data: scores, error: scoreError } = await this.supabase
      .from('opportunity_scores')
      .select('id')
      .eq('market_opportunity_id', opportunityId)
      .limit(1);

    if (scoreError !== null) {
      logger.warn('PrerequisiteChecker: failed to query opportunity_scores', {
        error: scoreError.message,
      });
      missing.push('Unable to verify opportunity scores (query error)');
    } else if (!scores || scores.length === 0) {
      missing.push('Market opportunity has no scores from Phase 0');
    }

    // Check that at least one signal is linked to the opportunity
    const { data: signals, error: signalError } = await this.supabase
      .from('signals')
      .select('id')
      .eq('market_opportunity_id', opportunityId)
      .limit(1);

    if (signalError !== null) {
      logger.warn('PrerequisiteChecker: failed to query signals', {
        error: signalError.message,
      });
      missing.push('Unable to verify linked signals (query error)');
    } else if (!signals || signals.length === 0) {
      missing.push('No signals linked to the market opportunity');
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 2 (Validation) requires:
  //   - A concept record with at least one score
  //   - The concept must have selected_for_validation = true
  // ---------------------------------------------------------------------------

  private async checkPhase2Prerequisites(
    item: PipelineItem,
    missing: string[],
  ): Promise<void> {
    const conceptId = item.concept_id;

    if (!conceptId) {
      missing.push('Pipeline item has no linked concept_id');
      return;
    }

    // Check concept record exists and is selected
    const { data: concept, error: conceptError } = await this.supabase
      .from('concepts')
      .select('id, selected_for_validation')
      .eq('id', conceptId)
      .maybeSingle();

    if (conceptError !== null) {
      logger.warn('PrerequisiteChecker: failed to query concepts', {
        error: conceptError.message,
      });
      missing.push('Unable to verify concept record (query error)');
      return;
    }

    if (concept === null) {
      missing.push('Concept record does not exist');
      return;
    }

    if (!concept.selected_for_validation) {
      missing.push('Concept has not been selected for validation');
    }

    // Check that at least one concept score exists
    const { data: scores, error: scoreError } = await this.supabase
      .from('concept_scores')
      .select('id')
      .eq('concept_id', conceptId)
      .limit(1);

    if (scoreError !== null) {
      logger.warn('PrerequisiteChecker: failed to query concept_scores', {
        error: scoreError.message,
      });
      missing.push('Unable to verify concept scores (query error)');
    } else if (!scores || scores.length === 0) {
      missing.push('Concept has no scores from Phase 1');
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 3 (Blueprint) requires:
  //   - A validation record with verdict 'go' or 'conditional_go'
  //   - Validation sub-sections populated (market_sizing, competitive_analysis,
  //     customer_validation, feasibility, economics)
  // ---------------------------------------------------------------------------

  private async checkPhase3Prerequisites(
    item: PipelineItem,
    missing: string[],
  ): Promise<void> {
    const conceptId = item.concept_id;

    if (!conceptId) {
      missing.push('Pipeline item has no linked concept_id');
      return;
    }

    // Check for a synthesis validation with go/conditional_go verdict
    const { data: synthesis, error: synthError } = await this.supabase
      .from('validations')
      .select('id, verdict, validation_phase')
      .eq('concept_id', conceptId)
      .eq('validation_phase', 'synthesis')
      .order('validated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (synthError !== null) {
      logger.warn('PrerequisiteChecker: failed to query validations', {
        error: synthError.message,
      });
      missing.push('Unable to verify validation synthesis record (query error)');
      return;
    }

    if (synthesis === null) {
      missing.push('No validation synthesis record exists for this concept');
      return;
    }

    const verdict = synthesis.verdict as string | null;
    if (verdict !== 'go' && verdict !== 'conditional_go') {
      missing.push(
        `Validation verdict is "${verdict ?? 'null'}" — must be "go" or "conditional_go" to enter Phase 3`,
      );
    }

    // Check that the required validation sub-section phases are populated
    const requiredPhases = [
      'market_sizing',
      'competitive_analysis',
      'customer_validation',
      'feasibility',
      'economics',
    ];

    const { data: validations, error: valError } = await this.supabase
      .from('validations')
      .select('validation_phase')
      .eq('concept_id', conceptId)
      .in('validation_phase', requiredPhases);

    if (valError !== null) {
      logger.warn('PrerequisiteChecker: failed to query validation sub-sections', {
        error: valError.message,
      });
      missing.push('Unable to verify validation sub-sections (query error)');
    } else {
      const foundPhases = new Set(
        (validations ?? []).map((v) => v.validation_phase as string),
      );
      for (const phase of requiredPhases) {
        if (!foundPhases.has(phase)) {
          missing.push(`Validation sub-section "${phase}" is not populated`);
        }
      }
    }
  }
}
