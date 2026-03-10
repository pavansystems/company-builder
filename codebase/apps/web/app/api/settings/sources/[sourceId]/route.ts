import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ sourceId: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { sourceId } = await params;
  const body = await req.json();
  const supabase = await createServerSupabaseClient();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.is_active !== undefined) updates.is_active = body.is_active;
  if (body.scan_frequency_hours !== undefined) {
    updates.config = { scan_frequency_hours: body.scan_frequency_hours };
  }
  if (body.name !== undefined) updates.name = body.name;
  if (body.url !== undefined) updates.url = body.url;

  const { data, error } = await supabase
    .from('sources')
    .update(updates)
    .eq('id', sourceId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { sourceId } = await params;
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from('sources').delete().eq('id', sourceId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
