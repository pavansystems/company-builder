export type PipelineState =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'blocked'
  | 'failed'
  | 'gate_review';

export const VALID_TRANSITIONS: Record<PipelineState, PipelineState[]> = {
  pending: ['in_progress'],
  in_progress: ['completed', 'blocked', 'failed', 'gate_review'],
  gate_review: ['in_progress', 'completed', 'failed'],
  blocked: ['in_progress', 'failed'],
  failed: ['pending'],
  completed: [],
};

// Event-to-state mapping for common pipeline events
const EVENT_TRANSITIONS: Record<string, Record<PipelineState, PipelineState | null>> = {
  start: {
    pending: 'in_progress',
    in_progress: null,
    completed: null,
    blocked: null,
    failed: null,
    gate_review: null,
  },
  complete: {
    pending: null,
    in_progress: 'completed',
    completed: null,
    blocked: null,
    failed: null,
    gate_review: 'completed',
  },
  block: {
    pending: null,
    in_progress: 'blocked',
    completed: null,
    blocked: null,
    failed: null,
    gate_review: null,
  },
  fail: {
    pending: null,
    in_progress: 'failed',
    completed: null,
    blocked: 'failed',
    failed: null,
    gate_review: 'failed',
  },
  gate: {
    pending: null,
    in_progress: 'gate_review',
    completed: null,
    blocked: null,
    failed: null,
    gate_review: null,
  },
  retry: {
    pending: null,
    in_progress: null,
    completed: null,
    blocked: 'in_progress',
    failed: 'pending',
    gate_review: 'in_progress',
  },
  resume: {
    pending: null,
    in_progress: null,
    completed: null,
    blocked: 'in_progress',
    failed: null,
    gate_review: null,
  },
};

/**
 * Returns true if the transition from `from` to `to` is valid according to
 * the pipeline state machine rules.
 */
export function isValidTransition(from: PipelineState, to: PipelineState): boolean {
  const allowedTargets = VALID_TRANSITIONS[from];
  return allowedTargets.includes(to);
}

/**
 * Given a current state and an event name, returns the next state or null if
 * the event is not applicable in the current state.
 */
export function getNextState(current: PipelineState, event: string): PipelineState | null {
  const eventMap = EVENT_TRANSITIONS[event];
  if (eventMap === undefined) {
    return null;
  }
  return eventMap[current] ?? null;
}
