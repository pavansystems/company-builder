import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Source } from '@company-builder/types';

export const maxDuration = 300;

/**
 * GET /api/cron/phase-0-scan
 *
 * Vercel cron endpoint that triggers Phase 0 Source Scanner.
 * Configured in vercel.json under "crons".
 *
 * Security: validates Authorization: Bearer <CRON_SECRET> header.
 * Only the Vercel cron service (or an authorized caller) can hit this endpoint.
 */
export async function GET(request: NextRequest) {
  // Validate cron secret
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (
    cronSecret === undefined ||
    cronSecret.length === 0 ||
    authHeader !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing Supabase environment variables' },
      { status: 500 },
    );
  }

  // Use service role client (cron has no user session)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // Fetch all active sources
  const { data: sources, error: sourcesError } = await supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)
    .order('last_scanned_at', { ascending: true, nullsFirst: true });

  if (sourcesError !== null) {
    console.error('[phase-0-scan] Failed to fetch active sources:', sourcesError.message);
    return NextResponse.json(
      { error: `Failed to fetch sources: ${sourcesError.message}` },
      { status: 500 },
    );
  }

  const activeSources = (sources ?? []) as Source[];

  if (activeSources.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No active sources found — nothing to scan.',
      sources_scanned: 0,
    });
  }

  // Build the agent input for the source scanner
  const agentInput = {
    pipeline_item_id: null,
    context: { sources: activeSources },
    instructions:
      'Scan all provided active sources and generate normalized content items for signal detection.',
  };

  // Call the source-scanner API route (allows cron auth bypass via same CRON_SECRET)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${request.headers.get('host')}`;
  const scannerUrl = `${baseUrl}/api/agents/source-scanner`;

  let scanResult: Record<string, unknown>;
  try {
    const response = await fetch(scannerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cronSecret}`,
      },
      body: JSON.stringify(agentInput),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Source scanner responded with ${response.status}: ${errorText}`);
    }

    scanResult = (await response.json()) as Record<string, unknown>;
  } catch (error) {
    console.error('[phase-0-scan] Source scanner call failed:', error);
    return NextResponse.json(
      { error: `Source scanner failed: ${String(error)}` },
      { status: 500 },
    );
  }

  // Update last_scanned_at for all sources that were scanned
  const scanTimestamp = new Date().toISOString();
  const sourceIds = activeSources.map((s) => s.id);

  const { error: updateError } = await supabase
    .from('sources')
    .update({ last_scanned_at: scanTimestamp })
    .in('id', sourceIds);

  if (updateError !== null) {
    // Non-fatal: log but don't fail the response
    console.warn('[phase-0-scan] Failed to update last_scanned_at:', updateError.message);
  }

  return NextResponse.json({
    success: true,
    message: 'Phase 0 scan triggered successfully.',
    sources_scanned: activeSources.length,
    source_names: activeSources.map((s) => s.name),
    scan_timestamp: scanTimestamp,
    scanner_result: {
      tokens_used: scanResult.tokens_used,
      cost_usd: scanResult.cost_usd,
      duration_ms: scanResult.duration_ms,
      success: scanResult.success,
    },
  });
}
