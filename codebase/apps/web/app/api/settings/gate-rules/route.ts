import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('gate_rules')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json() as {
    id: string;
    gate_type?: string;
    high_threshold?: number;
    low_threshold?: number;
  };
  const supabase = await createServerSupabaseClient();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.gate_type !== undefined) updates.gate_type = body.gate_type;
  if (body.high_threshold !== undefined) updates.high_threshold = body.high_threshold;
  if (body.low_threshold !== undefined) updates.low_threshold = body.low_threshold;

  const { data, error } = await supabase
    .from('gate_rules')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
