import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Source } from '@company-builder/types';
import { logger } from '@company-builder/core';

const log = logger.child({ service: 'api', route: 'cron/phase-0-scan' });

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

  // Fetch the 3 least-recently-scanned active sources (rotate through all sources across cron runs)
  const { data: sources, error: sourcesError } = await supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)
    .order('last_scanned_at', { ascending: true, nullsFirst: true })
    .limit(3);

  if (sourcesError !== null) {
    log.error('Failed to fetch active sources', { error: sourcesError.message });
    return NextResponse.json(
      { error: `Failed to fetch sources: ${sourcesError.message}` },
      { status: 500 },
    );
  }

  const activeSources = (sources ?? []) as Source[];

  log.info('Phase 0 scan started', { sourceCount: activeSources.length });

  if (activeSources.length === 0) {
    log.info('No active sources found, skipping scan');
    return NextResponse.json({
      success: true,
      message: 'No active sources found — nothing to scan.',
      sources_scanned: 0,
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${request.headers.get('host')}`;
  const scannerUrl = `${baseUrl}/api/agents/source-scanner`;

  const agentInput = {
    pipeline_item_id: null,
    account_id: activeSources[0]!.account_id,
    context: { sources: activeSources },
    instructions:
      'Scan all provided active sources and generate normalized content items for signal detection.',
  };

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
      throw new Error(`Source scanner responded with ${response.status}: ${errorText.slice(0, 300)}`);
    }

    scanResult = (await response.json()) as Record<string, unknown>;
  } catch (error) {
    log.error('Source scanner call failed', {
      error: error instanceof Error ? error.message : String(error),
      sourceCount: activeSources.length,
    });
    return NextResponse.json(
      { error: `Source scanner failed: ${String(error).slice(0, 300)}` },
      { status: 500 },
    );
  }

  // Update last_scanned_at for scanned sources
  const scanTimestamp = new Date().toISOString();
  const sourceIds = activeSources.map((s) => s.id);

  const { error: updateError } = await supabase
    .from('sources')
    .update({ last_scanned_at: scanTimestamp })
    .in('id', sourceIds);

  if (updateError !== null) {
    log.warn('Failed to update last_scanned_at', { error: updateError.message });
  }

  log.info('Phase 0 scan completed', {
    sourcesScanned: activeSources.length,
    scannerSuccess: scanResult.success,
  });

  return NextResponse.json({
    success: true,
    message: `Phase 0 scan completed. ${activeSources.length} sources scanned.`,
    sources_scanned: activeSources.length,
    source_names: activeSources.map((s) => s.name),
    scan_timestamp: scanTimestamp,
  });
}
