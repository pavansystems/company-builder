import { NextRequest, NextResponse } from 'next/server';
import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { BlueprintPdfDocument } from '@/components/blueprint/BlueprintPdfDocument';
import type { Blueprint } from '@company-builder/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ blueprintId: string }> }
) {
  try {
    const { blueprintId } = await params;
    const supabase = await createServerSupabaseClient();

    // Fetch the blueprint
    const { data: blueprint, error: bpError } = await supabase
      .from('blueprints')
      .select('*')
      .eq('id', blueprintId)
      .single();

    if (bpError || !blueprint) {
      return NextResponse.json(
        { error: 'Blueprint not found' },
        { status: 404 }
      );
    }

    // Fetch the concept title
    const { data: concept } = await supabase
      .from('concepts')
      .select('id, title')
      .eq('id', blueprint.concept_id)
      .single();

    const conceptTitle = concept?.title ?? 'Untitled Blueprint';

    // Generate PDF
    const doc = createElement(BlueprintPdfDocument, {
      blueprint: blueprint as unknown as Blueprint,
      conceptTitle,
    });

    const buffer = await renderToBuffer(doc as any);

    // Build filename
    const safeName = conceptTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `blueprint-${safeName}-${dateStr}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('PDF export error:', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
