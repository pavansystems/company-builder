import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { PipelineItemInsert } from '@company-builder/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);

    const phase = searchParams.get('phase');
    const status = searchParams.get('status');

    let query = supabase
      .from('pipeline_items')
      .select('*')
      .order('entered_phase_at', { ascending: false });

    if (phase) {
      // Map human-readable phase to phase key
      const phaseMap: Record<string, string> = {
        discovery: 'phase_0',
        ideation: 'phase_1',
        validation: 'phase_2',
        blueprint: 'phase_3',
      };
      const phaseKey = phaseMap[phase] ?? phase;
      query = query.eq('current_phase', phaseKey as 'phase_0' | 'phase_1' | 'phase_2' | 'phase_3' | 'rejected' | 'archived');
    }

    if (status) {
      query = query.eq('status', status as 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked');
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    const {
      item_type,
      market_opportunity_id,
      concept_id,
      source_id,
      current_phase,
      current_step,
      status,
      priority,
      tags,
    } = body as PipelineItemInsert;

    // Check for duplicate: don't create if already in pipeline
    if (market_opportunity_id) {
      const { data: existing } = await supabase
        .from('pipeline_items')
        .select('id, status, current_phase')
        .eq('market_opportunity_id', market_opportunity_id)
        .not('current_phase', 'in', '("rejected","archived")')
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: 'Opportunity is already in the pipeline', existing },
          { status: 409 }
        );
      }
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('pipeline_items')
      .insert({
        item_type: item_type ?? 'opportunity',
        market_opportunity_id: market_opportunity_id ?? null,
        concept_id: concept_id ?? null,
        source_id: source_id ?? null,
        current_phase: current_phase ?? 'phase_1',
        current_step: current_step ?? null,
        status: status ?? 'pending',
        priority: priority ?? 'normal',
        tags: tags ?? null,
        entered_phase_at: now,
        entered_step_at: now,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
