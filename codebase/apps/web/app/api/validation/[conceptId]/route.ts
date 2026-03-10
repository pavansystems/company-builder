import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ conceptId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { conceptId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: validations, error } = await supabase
    .from('validations')
    .select('*')
    .eq('concept_id', conceptId)
    .order('validated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(validations ?? []);
}
