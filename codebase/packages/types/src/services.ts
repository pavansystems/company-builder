export type AnnotatedObjectType =
  | 'opportunity'
  | 'concept'
  | 'validation'
  | 'blueprint'
  | 'signal';

export type AnnotationType =
  | 'note'
  | 'flag'
  | 'override_score'
  | 'suggest_rejection'
  | 'suggest_advancement';

export type FeedbackEventType =
  | 'validation_passed'
  | 'validation_failed'
  | 'blueprint_launched'
  | 'gate_override';

export interface UserAnnotation {
  id: string;

  // Annotation target
  annotated_object_type: AnnotatedObjectType;
  annotated_object_id: string;

  // Annotation content
  annotation_type: AnnotationType;
  content: string | null;

  // If score override
  score_override_dimension: string | null;
  score_override_value: number | null;
  override_reason: string | null;

  // Metadata
  created_by: string;
  created_at: string;
  resolved: boolean;
  resolved_at: string | null;
  account_id: string;
}

export interface UserAnnotationInsert {
  id?: string;
  annotated_object_type: AnnotatedObjectType;
  annotated_object_id: string;
  annotation_type: AnnotationType;
  content?: string | null;
  score_override_dimension?: string | null;
  score_override_value?: number | null;
  override_reason?: string | null;
  created_by: string;
  created_at?: string;
  resolved?: boolean;
  resolved_at?: string | null;
  account_id?: string;
}

export interface FeedbackEvent {
  id: string;

  // What happened
  event_type: FeedbackEventType | null;
  related_concept_id: string | null;

  // Outcome
  outcome: string | null;
  outcome_confidence: number | null;

  // Learning
  learning_for_phase: string | null;
  learning_detail: string | null;

  // Metadata
  occurred_at: string;
  recorded_at: string;
  account_id: string;
}

export interface FeedbackEventInsert {
  id?: string;
  event_type?: FeedbackEventType | null;
  related_concept_id?: string | null;
  outcome?: string | null;
  outcome_confidence?: number | null;
  learning_for_phase?: string | null;
  learning_detail?: string | null;
  occurred_at?: string;
  recorded_at?: string;
  account_id?: string;
}
