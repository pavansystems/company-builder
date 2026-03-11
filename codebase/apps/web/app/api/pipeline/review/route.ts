import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// GET /api/pipeline/review
// Returns the count of items pending human review.
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { count, error } = await supabase
      .from('pipeline_items')
      .select('id', { count: 'exact', head: true })
      .or('status.eq.blocked,last_gate_decision.eq.review');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
