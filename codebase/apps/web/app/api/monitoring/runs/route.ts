import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const agentName = searchParams.get('agent_name');
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const sortBy = searchParams.get('sort_by') ?? 'started_at';
    const sortOrder = searchParams.get('sort_order') ?? 'desc';

    const validSortColumns = [
      'started_at',
      'agent_name',
      'status',
      'execution_duration_seconds',
      'cost_usd',
      'tokens_input',
      'tokens_output',
    ];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'started_at';

    let query = supabase
      .from('agent_runs')
      .select('*', { count: 'exact' })
      .order(safeSortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status as 'success' | 'partial' | 'failed' | 'timeout');
    }

    if (agentName) {
      query = query.eq('agent_name', agentName);
    }

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      runs: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
