-- Migration 012: Add watchdog_stall event type to feedback_events
-- Allows WatchdogTimer to emit feedback events when items are detected as stalled.

ALTER TABLE feedback_events DROP CONSTRAINT IF EXISTS event_type_valid;

ALTER TABLE feedback_events
  ADD CONSTRAINT event_type_valid CHECK (
    event_type IN (
      'validation_passed',
      'validation_failed',
      'blueprint_launched',
      'gate_override',
      'watchdog_stall'
    )
  );
