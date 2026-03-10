import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { UserAnnotationInsert } from '@company-builder/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    const { entityType, entityId, annotationType, notes } = body as {
      entityType: string;
      entityId: string;
      annotationType: string;
      notes?: string;
    };

    if (!entityType || !entityId || !annotationType) {
      return NextResponse.json(
        { error: 'entityType, entityId, and annotationType are required' },
        { status: 400 }
      );
    }

    const annotation: UserAnnotationInsert = {
      annotated_object_type: entityType as UserAnnotationInsert['annotated_object_type'],
      annotated_object_id: entityId,
      annotation_type: annotationType as UserAnnotationInsert['annotation_type'],
      content: notes ?? null,
      created_by: 'user',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_annotations')
      .insert(annotation)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ annotation: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
