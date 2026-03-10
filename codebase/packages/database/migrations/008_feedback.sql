-- Migration 008: User Annotations and Feedback Events
-- Human review and feedback loop tables

CREATE TABLE IF NOT EXISTS user_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Annotation target
  annotated_object_type VARCHAR(50) NOT NULL,
  annotated_object_id UUID NOT NULL,

  -- Annotation content
  annotation_type VARCHAR(50) NOT NULL,
  content TEXT,

  -- If score override
  score_override_dimension VARCHAR(255),
  score_override_value NUMERIC(3,2),
  override_reason TEXT,

  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,

  CONSTRAINT annotated_object_type_valid CHECK (annotated_object_type IN ('opportunity', 'concept', 'validation', 'blueprint', 'signal')),
  CONSTRAINT annotation_type_valid CHECK (annotation_type IN ('note', 'flag', 'override_score', 'suggest_rejection', 'suggest_advancement')),
  CONSTRAINT score_override_range CHECK (score_override_value IS NULL OR (score_override_value >= 0.0 AND score_override_value <= 1.0))
);

CREATE INDEX IF NOT EXISTS idx_annotations_object ON user_annotations(annotated_object_type, annotated_object_id);
CREATE INDEX IF NOT EXISTS idx_annotations_created_by ON user_annotations(created_by);
CREATE INDEX IF NOT EXISTS idx_annotations_created_at ON user_annotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_annotations_resolved ON user_annotations(resolved) WHERE resolved = FALSE;

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS feedback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What happened
  event_type VARCHAR(50),
  related_concept_id UUID REFERENCES concepts(id),

  -- Outcome
  outcome TEXT,
  outcome_confidence NUMERIC(3,2),

  -- Learning
  learning_for_phase VARCHAR(50),
  learning_detail TEXT,

  -- Metadata
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT event_type_valid CHECK (event_type IN ('validation_passed', 'validation_failed', 'blueprint_launched', 'gate_override')),
  CONSTRAINT outcome_confidence_range CHECK (outcome_confidence IS NULL OR (outcome_confidence >= 0.0 AND outcome_confidence <= 1.0))
);

CREATE INDEX IF NOT EXISTS idx_feedback_events_type ON feedback_events(event_type);
CREATE INDEX IF NOT EXISTS idx_feedback_events_concept ON feedback_events(related_concept_id);
CREATE INDEX IF NOT EXISTS idx_feedback_events_occurred ON feedback_events(occurred_at DESC);
