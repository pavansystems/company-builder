import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import type { FeedbackEventInsert, FeedbackEventType } from '@company-builder/types';

export const maxDuration = 30;

interface FeedbackEventBody {
  eventType: FeedbackEventType;
  relatedConceptId?: string;
  outcome?: string;
  outcomeConfidence?: number;
  learningForPhase?: string;
  learningDetail?: string;
  occurredAt?: string;
}

/**
 * POST /api/services/feedback/event
 *
 * Records a feedback event (e.g. validation_passed, blueprint_launched, gate_override)
 * tied to a concept for FeedbackLoopService aggregation.
 * Requires an authenticated user session.
 *
 * Body: {
 *   eventType: FeedbackEventType;
 *   relatedConceptId?: string;
 *   outcome?: string;
 *   outcomeConfidence?: number;
 *   learningForPhase?: string;
 *   learningDetail?: string;
 *   occurredAt?: string;
 * }
 * Returns: { success: boolean; eventId: string }
 */
export async function POST(request: NextRequest) {
  // Require authenticated user
  const supabaseUser = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: FeedbackEventBody;
  try {
    body = (await request.json()) as FeedbackEventBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    eventType,
    relatedConceptId,
    outcome,
    outcomeConfidence,
    learningForPhase,
    learningDetail,
    occurredAt,
  } = body;

  if (!eventType) {
    return NextResponse.json({ error: 'Missing required field: eventType' }, { status: 400 });
  }

  const validEventTypes: FeedbackEventType[] = [
    'validation_passed',
    'validation_failed',
    'blueprint_launched',
    'gate_override',
  ];

  if (!validEventTypes.includes(eventType)) {
    return NextResponse.json(
      {
        error: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}`,
      },
      { status: 400 },
    );
  }

  // Use service role for writes so RLS does not block
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const now = new Date().toISOString();

  const record: FeedbackEventInsert = {
    event_type: eventType,
    related_concept_id: relatedConceptId ?? null,
    outcome: outcome ?? null,
    outcome_confidence: outcomeConfidence ?? null,
    learning_for_phase: learningForPhase ?? null,
    learning_detail: learningDetail ?? null,
    occurred_at: occurredAt ?? now,
    recorded_at: now,
    account_id: user.id,
  };

  const { data: inserted, error: insertError } = await supabase
    .from('feedback_events')
    .insert(record)
    .select('id')
    .single();

  if (insertError !== null) {
    console.error('[feedback/event] Insert failed:', insertError.message);
    return NextResponse.json(
      { error: `Failed to record feedback event: ${insertError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    eventId: (inserted as { id: string }).id,
  });
}
