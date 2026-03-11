import type { SupabaseClient } from '@supabase/supabase-js';
import type { GateEvaluator, GateOutcome } from '@company-builder/core';
import type { TaskDispatcher } from '@company-builder/core';
import type { WatchdogTimer } from '@company-builder/core';
import type { PipelineItem, PipelinePhase, AgentOutput } from '@company-builder/types';
import { logger, PrerequisiteChecker, type Logger } from '@company-builder/core';
import { getInFlightCountsByPhase } from '@company-builder/database';

// ---------------------------------------------------------------------------
// Phase step registries
// ---------------------------------------------------------------------------

const PHASE_STEPS: Record<PipelinePhase, string[]> = {
  phase_0: [
    'source-scanner',
    'signal-detector',
    'market-classifier',
    'opportunity-ranker',
    'watchlist-publisher',
  ],
  phase_1: [
    'landscape-analyst',
    'pain-extractor',
    'concept-generator',
    'concept-scorer',
    'concept-selector',
  ],
  phase_2: [
    'market-sizer',
    'competitive-analyst',
    'customer-validator',
    'feasibility-assessor',
    'economics-modeler',
    'validation-synthesizer',
  ],
  phase_3: [
    'business-designer',
    'agent-architect',
    'gtm-strategist',
    'risk-analyst',
    'resource-planner',
    'blueprint-packager',
  ],
  // Terminal phases — no steps
  archived: [],
};

// Gate phase transitions
const PHASE_GATE_TRANSITIONS: Partial<Record<PipelinePhase, { from: string; to: string; next: PipelinePhase }>> = {
  phase_0: { from: 'phase_0', to: 'phase_1', next: 'phase_1' },
  phase_1: { from: 'phase_1', to: 'phase_2', next: 'phase_2' },
  phase_2: { from: 'phase_2', to: 'phase_3', next: 'phase_3' },
};

// Per-phase concurrency limits — max in_progress items per phase
const PHASE_CONCURRENCY_LIMITS: Record<string, number> = {
  phase_0: 10,
  phase_1: 5,
  phase_2: 3,
  phase_3: 2,
};

// Total capacity across all phases (used for backpressure detection)
const TOTAL_CAPACITY = Object.values(PHASE_CONCURRENCY_LIMITS).reduce((a, b) => a + b, 0);
const BACKPRESSURE_THRESHOLD = 0.8;

// Default gate evaluation weights per phase
const GATE_WEIGHTS: Record<string, Record<string, number>> = {
  phase_0: {
    opportunity_score: 0.5,
    agent_readiness: 0.3,
    market_size: 0.2,
  },
  phase_1: {
    concept_score: 0.4,
    disruption_potential: 0.2,
    feasibility: 0.2,
    differentiation: 0.2,
  },
  phase_2: {
    validation_confidence: 0.4,
    ltv_cac_ratio: 0.3,
    market_sizing_confidence: 0.3,
  },
};

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface TickResult {
  processed: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class PipelineOrchestratorService {
  private readonly prerequisiteChecker: PrerequisiteChecker;
  private readonly log: Logger;

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly dispatcher: TaskDispatcher,
    private readonly gateEvaluator: GateEvaluator,
    private readonly watchdog: WatchdogTimer,
  ) {
    this.prerequisiteChecker = new PrerequisiteChecker(supabase);
    this.log = logger.child({ service: 'PipelineOrchestrator' });
  }

  // ---------------------------------------------------------------------------
  // tick() — called by cron every minute
  // ---------------------------------------------------------------------------

  /**
   * Main cron entry point. Called every minute by /api/cron/orchestrator-tick.
   *
   * 1. Check for stalled items via watchdog and mark them blocked
   * 2. Load all pending/in_progress pipeline items
   * 3. For each item, call processItem()
   *
   * Returns how many items were processed and any errors encountered.
   */
  async tick(): Promise<TickResult> {
    const errors: string[] = [];
    let processed = 0;

    this.log.info('PipelineOrchestratorService: tick started');

    // Step 1: Check for stalled in_progress items
    try {
      const stalledItems = await this.watchdog.checkForStalledItems();
      for (const item of stalledItems) {
        try {
          await this.watchdog.markAsBlocked(item);
          await this.logEvent(item.id, 'stall_detected', {
            step: item.current_step,
            phase: item.current_phase,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.log.error('Failed to mark stalled item as blocked', { itemId: item.id, error: msg });
          errors.push(`stall-${item.id}: ${msg}`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log.error('Watchdog check failed', { error: msg });
      errors.push(`watchdog: ${msg}`);
    }

    // Step 2: Query current in-flight counts per phase for concurrency enforcement
    let inFlightCounts: Record<string, number> = {};
    try {
      const { data: counts, error: countsError } = await getInFlightCountsByPhase(this.supabase);
      if (countsError !== null) {
        this.log.warn('Failed to query in-flight counts, proceeding without concurrency limits', {
          error: countsError.message,
        });
      } else {
        inFlightCounts = counts;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log.warn('Failed to query in-flight counts, proceeding without concurrency limits', {
        error: msg,
      });
    }

    // Backpressure check: warn if total in-flight approaches capacity
    const totalInFlight = Object.values(inFlightCounts).reduce((a, b) => a + b, 0);
    if (totalInFlight >= TOTAL_CAPACITY * BACKPRESSURE_THRESHOLD) {
      this.log.warn('Pipeline backpressure: in-flight items approaching total capacity', {
        totalInFlight,
        totalCapacity: TOTAL_CAPACITY,
        utilizationPct: Math.round((totalInFlight / TOTAL_CAPACITY) * 100),
        perPhase: inFlightCounts,
      });
    }

    // Step 3: Load all actionable pipeline items
    let items: PipelineItem[] = [];
    try {
      const { data, error } = await this.supabase
        .from('pipeline_items')
        .select('*')
        .in('status', ['pending', 'in_progress'])
        .in('current_phase', ['phase_0', 'phase_1', 'phase_2', 'phase_3'])
        .order('entered_phase_at', { ascending: true })
        .limit(50); // Process up to 50 items per tick to avoid timeout

      if (error !== null) {
        throw new Error(`Failed to query pipeline items: ${error.message}`);
      }
      items = (data ?? []) as PipelineItem[];
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log.error('Failed to load pipeline items', { error: msg });
      errors.push(`query: ${msg}`);
      return { processed, errors };
    }

    // Step 4: Process each item, enforcing per-phase concurrency limits
    // Track in-flight counts locally as we dispatch within this tick
    const tickInFlightCounts = { ...inFlightCounts };

    for (const item of items) {
      const phase = item.current_phase;

      // For pending items that would be dispatched, check phase concurrency
      if (phase !== null && item.status === 'pending') {
        const limit = PHASE_CONCURRENCY_LIMITS[phase];
        if (limit !== undefined) {
          const currentCount = tickInFlightCounts[phase] ?? 0;
          if (currentCount >= limit) {
            this.log.debug('Skipping item — phase at concurrency limit', {
              itemId: item.id,
              phase,
              currentCount,
              limit,
            });
            continue;
          }
        }
      }

      try {
        await this.processItem(item);
        processed++;

        // If item was pending and got dispatched, increment the local in-flight count
        if (phase !== null && item.status === 'pending') {
          tickInFlightCounts[phase] = (tickInFlightCounts[phase] ?? 0) + 1;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.log.error('Failed to process pipeline item', { itemId: item.id, error: msg });
        errors.push(`item-${item.id}: ${msg}`);
      }
    }

    this.log.info('PipelineOrchestratorService: tick completed', {
      processed,
      errorCount: errors.length,
    });

    return { processed, errors };
  }

  // ---------------------------------------------------------------------------
  // processItem() — determine next action for a single item
  // ---------------------------------------------------------------------------

  /**
   * Determines the next agent to run for the current step and dispatches it.
   *
   * - If the item is 'pending', determine the next agent and dispatch it
   * - If the item is 'in_progress', check if the current step completed (its
   *   agent run has a success status) and advance
   * - If all steps in the phase are done, evaluate the gate
   */
  async processItem(item: PipelineItem): Promise<void> {
    const phase = item.current_phase;
    if (phase === null || phase === 'archived') {
      return;
    }

    const steps = this.getPhaseSteps(phase);
    if (steps.length === 0) {
      return;
    }

    // Determine the current step: if current_step is null, start with first step
    const currentStep = item.current_step ?? steps[0] ?? null;

    if (currentStep === null) {
      return;
    }

    // Check if current step is complete by looking for a successful agent run
    const stepCompleted = await this.isStepComplete(item.id, currentStep);

    if (!stepCompleted && item.status === 'in_progress') {
      // Step is still in flight — nothing to do, watchdog will catch stalls
      return;
    }

    if (stepCompleted) {
      // Advance to next step
      const nextStep = this.getNextStep(currentStep, phase);

      if (nextStep === null) {
        // All steps in this phase are done — evaluate gate
        this.log.info('All phase steps completed, evaluating gate', {
          itemId: item.id,
          phase,
        });
        // Reload latest item state before evaluating gate
        const { data: freshItem } = await this.supabase
          .from('pipeline_items')
          .select('*')
          .eq('id', item.id)
          .single();

        if (freshItem !== null) {
          await this.evaluateGate(freshItem as PipelineItem, phase);
        }
        return;
      }

      // Mark item as pending for next step
      await this.supabase
        .from('pipeline_items')
        .update({
          current_step: nextStep,
          status: 'pending',
          entered_step_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      await this.logEvent(item.id, 'step_advanced', {
        from: currentStep,
        to: nextStep,
        phase,
      });
    }

    // (Re)dispatch: item is pending — fire the next agent
    if (item.status === 'pending' || stepCompleted) {
      const targetStep = stepCompleted
        ? (this.getNextStep(currentStep, phase) ?? currentStep)
        : currentStep;

      if (targetStep === null) {
        return;
      }

      await this.supabase
        .from('pipeline_items')
        .update({
          status: 'in_progress',
          entered_step_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      await this.dispatcher.dispatch(targetStep, {
        pipeline_item_id: item.id,
        context: {
          itemId: item.id,
          phase,
          step: targetStep,
          marketOpportunityId: item.market_opportunity_id,
          conceptId: item.concept_id,
        },
        instructions: `Execute ${targetStep} for pipeline item ${item.id} in phase ${phase}.`,
      });

      await this.logEvent(item.id, 'agent_dispatched', {
        agent: targetStep,
        phase,
      });

      this.log.info('Agent dispatched', {
        itemId: item.id,
        agent: targetStep,
        phase,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // handleAgentCompletion() — called when an agent finishes (via callback route)
  // ---------------------------------------------------------------------------

  /**
   * Called by /api/services/orchestrator/callback when an agent completes.
   *
   * 1. Mark the agent's step as complete in pipeline state
   * 2. Advance to next step or evaluate gate if phase is done
   */
  async handleAgentCompletion(
    pipelineItemId: string,
    agentName: string,
    output: AgentOutput,
  ): Promise<void> {
    this.log.info('Agent completion received', { pipelineItemId, agentName, success: output.success });

    // Load current item state
    const { data: itemData, error: itemError } = await this.supabase
      .from('pipeline_items')
      .select('*')
      .eq('id', pipelineItemId)
      .single();

    if (itemError !== null || itemData === null) {
      throw new Error(
        `handleAgentCompletion: Pipeline item ${pipelineItemId} not found: ${itemError?.message ?? 'null data'}`,
      );
    }

    const item = itemData as PipelineItem;
    const phase = item.current_phase;

    if (phase === null || phase === 'archived') {
      this.log.warn('Agent completion received for item in terminal phase', {
        pipelineItemId,
        phase,
      });
      return;
    }

    if (!output.success) {
      // Agent failed — mark item as failed, log error
      await this.supabase
        .from('pipeline_items')
        .update({ status: 'failed' })
        .eq('id', pipelineItemId);

      await this.logEvent(pipelineItemId, 'step_failed', {
        agent: agentName,
        error: output.error ?? 'Agent returned success=false',
      });
      return;
    }

    // Determine next step
    const nextStep = this.getNextStep(agentName, phase);

    if (nextStep === null) {
      // This was the last step in the phase — evaluate gate
      await this.evaluateGate(item, phase);
      return;
    }

    // Advance to next step
    await this.supabase
      .from('pipeline_items')
      .update({
        current_step: nextStep,
        status: 'pending',
        entered_step_at: new Date().toISOString(),
      })
      .eq('id', pipelineItemId);

    await this.logEvent(pipelineItemId, 'step_completed', {
      completedStep: agentName,
      nextStep,
      phase,
    });

    // Immediately dispatch next agent (no need to wait for next tick)
    await this.dispatcher.dispatch(nextStep, {
      pipeline_item_id: pipelineItemId,
      context: {
        itemId: pipelineItemId,
        phase,
        step: nextStep,
        marketOpportunityId: item.market_opportunity_id,
        conceptId: item.concept_id,
      },
      instructions: `Execute ${nextStep} for pipeline item ${pipelineItemId} in phase ${phase}.`,
    });

    await this.supabase
      .from('pipeline_items')
      .update({ status: 'in_progress' })
      .eq('id', pipelineItemId);
  }

  // ---------------------------------------------------------------------------
  // evaluateGate() — called when all steps in a phase are complete
  // ---------------------------------------------------------------------------

  /**
   * Evaluates the gate at the end of a phase.
   *
   * 1. Loads the relevant scores from the pipeline item's phase data
   * 2. Calls GateEvaluator.evaluate() with appropriate weights
   * 3. Advances the item to the next phase, puts it in review, or rejects it
   */
  async evaluateGate(item: PipelineItem, currentPhase: PipelinePhase): Promise<GateOutcome> {
    const transition = PHASE_GATE_TRANSITIONS[currentPhase];
    if (!transition) {
      // Phase 3 has no gate — mark as completed
      await this.supabase
        .from('pipeline_items')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      await this.logEvent(item.id, 'phase_completed', { phase: currentPhase });
      return 'advance';
    }

    // Collect dimension scores from stored agent run outputs for this item
    const dimensions = await this.collectGateDimensions(item.id, currentPhase);
    const weights = GATE_WEIGHTS[currentPhase] ?? { composite_score: 1.0 };

    let evaluationResult;
    try {
      evaluationResult = await this.gateEvaluator.evaluate(
        transition.from,
        transition.to,
        dimensions,
        weights,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log.error('Gate evaluation failed', { itemId: item.id, phase: currentPhase, error: msg });

      // Default to review if gate evaluation fails (safe fallback)
      evaluationResult = {
        outcome: 'review' as GateOutcome,
        score: 0,
        rationale: `Gate evaluation error: ${msg}`,
        dimensions,
      };
    }

    const { outcome, score, rationale } = evaluationResult;

    this.log.info('Gate evaluated', {
      itemId: item.id,
      phase: currentPhase,
      outcome,
      score,
    });

    // Persist gate decision record
    await this.supabase.from('gate_decisions').insert({
      pipeline_item_id: item.id,
      gate_phase: currentPhase,
      decision: outcome === 'advance' ? 'pass'
        : outcome === 'reject' ? 'fail'
        : 'pass', // review maps to pass (pending human override)
      decision_by: 'orchestrator',
      decision_reason: rationale,
      pre_decision_data: { score, dimensions },
      decided_at: new Date().toISOString(),
    });

    // Update pipeline item based on outcome
    if (outcome === 'advance') {
      await this.advanceToNextPhase(item, transition.next);
    } else if (outcome === 'reject') {
      await this.supabase
        .from('pipeline_items')
        .update({
          status: 'failed',
          last_gate_decision: 'rejected',
          last_gate_at: new Date().toISOString(),
          last_gate_reason: rationale,
          last_gate_by: 'orchestrator',
          current_phase: 'archived',
        })
        .eq('id', item.id);

      await this.logEvent(item.id, 'gate_rejected', { phase: currentPhase, score, rationale });
    } else {
      // review — put in blocked state waiting for human decision
      await this.supabase
        .from('pipeline_items')
        .update({
          status: 'blocked',
          last_gate_decision: 'pending_review',
          last_gate_at: new Date().toISOString(),
          last_gate_reason: rationale,
          last_gate_by: 'orchestrator',
        })
        .eq('id', item.id);

      await this.logEvent(item.id, 'gate_review_required', { phase: currentPhase, score, rationale });
    }

    return outcome;
  }

  // ---------------------------------------------------------------------------
  // advanceToNextPhase() — move item into the next phase
  // ---------------------------------------------------------------------------

  async advanceToNextPhase(item: PipelineItem, nextPhase: PipelinePhase): Promise<void> {
    // Validate prerequisites before allowing the phase transition
    const prerequisiteResult = await this.prerequisiteChecker.checkPrerequisites(item, nextPhase);

    if (!prerequisiteResult.satisfied) {
      const missingDescription = prerequisiteResult.missing.join('; ');

      this.log.warn('Phase transition blocked by unmet prerequisites', {
        itemId: item.id,
        fromPhase: item.current_phase,
        targetPhase: nextPhase,
        missing: prerequisiteResult.missing,
      });

      // Block the item with a descriptive message instead of advancing
      await this.supabase
        .from('pipeline_items')
        .update({
          status: 'blocked',
          last_gate_decision: 'pending_review',
          last_gate_at: new Date().toISOString(),
          last_gate_reason: `Prerequisites not met for ${nextPhase}: ${missingDescription}`,
          last_gate_by: 'orchestrator',
        })
        .eq('id', item.id);

      await this.logEvent(item.id, 'prerequisites_not_met', {
        fromPhase: item.current_phase,
        targetPhase: nextPhase,
        missing: prerequisiteResult.missing,
      });

      return;
    }

    const steps = this.getPhaseSteps(nextPhase);
    const firstStep = steps[0] ?? null;

    await this.supabase
      .from('pipeline_items')
      .update({
        current_phase: nextPhase,
        current_step: firstStep,
        status: 'pending',
        entered_phase_at: new Date().toISOString(),
        entered_step_at: new Date().toISOString(),
        last_gate_decision: 'approved',
        last_gate_at: new Date().toISOString(),
        last_gate_by: 'orchestrator',
      })
      .eq('id', item.id);

    await this.logEvent(item.id, 'phase_advanced', {
      fromPhase: item.current_phase,
      toPhase: nextPhase,
      firstStep,
    });

    this.log.info('Pipeline item advanced to next phase', {
      itemId: item.id,
      fromPhase: item.current_phase,
      toPhase: nextPhase,
    });
  }

  // ---------------------------------------------------------------------------
  // getPhaseSteps() / getNextStep() — phase step registry helpers
  // ---------------------------------------------------------------------------

  getPhaseSteps(phase: PipelinePhase): string[] {
    return PHASE_STEPS[phase] ?? [];
  }

  getNextStep(currentStep: string, phase: PipelinePhase): string | null {
    const steps = this.getPhaseSteps(phase);
    const idx = steps.indexOf(currentStep);
    if (idx === -1 || idx === steps.length - 1) {
      return null;
    }
    return steps[idx + 1] ?? null;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Checks whether a given step (agent) has produced a successful run for this item.
   */
  private async isStepComplete(pipelineItemId: string, agentName: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('agent_runs')
      .select('id, status')
      .eq('pipeline_item_id', pipelineItemId)
      .eq('agent_name', agentName)
      .eq('status', 'success')
      .limit(1)
      .maybeSingle();

    if (error !== null) {
      this.log.warn('isStepComplete query error', {
        pipelineItemId,
        agentName,
        error: error.message,
      });
      return false;
    }

    return data !== null;
  }

  /**
   * Collects gate evaluation dimension scores from agent run outputs.
   * Extracts score-relevant fields from the phase's completed agent outputs.
   */
  private async collectGateDimensions(
    pipelineItemId: string,
    phase: PipelinePhase,
  ): Promise<Record<string, number>> {
    // Query all successful agent runs for this item in this phase
    const steps = this.getPhaseSteps(phase);

    const { data: runs, error } = await this.supabase
      .from('agent_runs')
      .select('agent_name, output_data')
      .eq('pipeline_item_id', pipelineItemId)
      .eq('status', 'success')
      .in('agent_name', steps);

    if (error !== null || !Array.isArray(runs)) {
      this.log.warn('collectGateDimensions: failed to load agent runs', {
        pipelineItemId,
        error: error?.message,
      });
      return { composite_score: 0.5 };
    }

    // Extract scores from known output fields
    const dimensions: Record<string, number> = {};

    for (const run of runs) {
      const outputData = (run.output_data ?? {}) as Record<string, unknown>;

      // Phase 0: opportunity-ranker produces opportunityScore
      if (run.agent_name === 'opportunity-ranker') {
        const score = outputData.opportunityScore ?? outputData.opportunity_score;
        if (typeof score === 'number') {
          dimensions.opportunity_score = score;
        }
        const readiness = outputData.agentReadiness ?? outputData.agent_readiness;
        if (typeof readiness === 'number') {
          dimensions.agent_readiness = readiness;
        }
      }

      // Phase 1: concept-scorer produces composite_score + dimension scores
      if (run.agent_name === 'concept-scorer') {
        const conceptScore = outputData.compositeScore ?? outputData.composite_score;
        if (typeof conceptScore === 'number') {
          dimensions.concept_score = conceptScore;
        }
        const disruptionPotential = outputData.disruptionPotential ?? outputData.disruption_potential;
        if (typeof disruptionPotential === 'number') {
          dimensions.disruption_potential = disruptionPotential;
        }
        const feasibility = outputData.feasibility;
        if (typeof feasibility === 'number') {
          dimensions.feasibility = feasibility;
        }
        const differentiation = outputData.differentiation;
        if (typeof differentiation === 'number') {
          dimensions.differentiation = differentiation;
        }
      }

      // Phase 2: validation-synthesizer produces confidence and verdict scores
      if (run.agent_name === 'validation-synthesizer') {
        const confidence = outputData.confidence;
        if (typeof confidence === 'number') {
          dimensions.validation_confidence = confidence;
        }
      }

      // Phase 2: economics-modeler produces ltv_cac_ratio
      if (run.agent_name === 'economics-modeler') {
        const ltvCac = outputData.ltvCacRatio ?? outputData.ltv_cac_ratio;
        if (typeof ltvCac === 'number') {
          // Normalize to 0-100 scale (LTV/CAC of 10 = score of 100)
          dimensions.ltv_cac_ratio = Math.min(ltvCac * 10, 100);
        }
      }

      // Phase 2: market-sizer confidence
      if (run.agent_name === 'market-sizer') {
        const confidence = outputData.tamConfidence ?? outputData.tam_confidence;
        if (typeof confidence === 'number') {
          dimensions.market_sizing_confidence = confidence;
        }
      }
    }

    // Default fallback if no dimensions extracted
    if (Object.keys(dimensions).length === 0) {
      dimensions.composite_score = 50; // Neutral default triggers review
    }

    return dimensions;
  }

  /**
   * Logs a structured pipeline event for auditability.
   */
  private async logEvent(
    pipelineItemId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.supabase.from('pipeline_events').insert({
        pipeline_item_id: pipelineItemId,
        event_type: eventType,
        payload,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      // Event logging failures are non-fatal
      this.log.warn('Failed to log pipeline event', {
        pipelineItemId,
        eventType,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
