import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface RouteParams {
  params: { itemId: string };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { itemId } = params;

    // Fetch pipeline item
    const { data: item, error: itemError } = await supabase
      .from('pipeline_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Pipeline item not found' }, { status: 404 });
    }

    // Fetch events for this item
    const { data: events = [] } = await supabase
      .from('pipeline_events')
      .select('*')
      .eq('pipeline_item_id', itemId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch agent runs if available
    const { data: agentRuns = [] } = await supabase
      .from('agent_runs')
      .select('*')
      .eq('pipeline_item_id', itemId)
      .order('started_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      item,
      events: events ?? [],
      agentRuns: agentRuns ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { itemId } = params;
    const body = await request.json();

    // Validate the item exists
    const { data: existing, error: checkError } = await supabase
      .from('pipeline_items')
      .select('id, status, current_phase')
      .eq('id', itemId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Pipeline item not found' }, { status: 404 });
    }

    const allowed = ['status', 'current_step', 'priority', 'tags', 'current_phase'];
    const updates: Record<string, unknown> = {};

    for (const key of allowed) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    // If resetting to pending (retry blocked item), clear gate fields
    if (updates.status === 'pending' && existing.status === 'blocked') {
      updates.last_gate_decision = null;
      updates.last_gate_at = null;
      updates.last_gate_reason = null;
      updates.entered_step_at = new Date().toISOString();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('pipeline_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Note: pipeline_events table not in schema — status changes tracked via gate_decisions

    return NextResponse.json({ item: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
