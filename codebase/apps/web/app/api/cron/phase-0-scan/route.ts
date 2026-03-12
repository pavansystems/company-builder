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

  // Fetch all active sources
  const { data: sources, error: sourcesError } = await supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)
    .order('last_scanned_at', { ascending: true, nullsFirst: true });

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

  // Process sources in batches of 3 to stay within function timeout
  const BATCH_SIZE = 3;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${request.headers.get('host')}`;
  const scannerUrl = `${baseUrl}/api/agents/source-scanner`;
  const scanTimestamp = new Date().toISOString();

  const results: Array<{ batch: number; success: boolean; sources: string[]; error?: string }> = [];
  let totalScanned = 0;

  for (let i = 0; i < activeSources.length; i += BATCH_SIZE) {
    const batch = activeSources.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    log.info(`Scanning batch ${batchNum}`, { sources: batch.map((s) => s.name) });

    const agentInput = {
      pipeline_item_id: null,
      context: { sources: batch },
      instructions:
        'Scan all provided active sources and generate normalized content items for signal detection.',
    };

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
        throw new Error(`Source scanner responded with ${response.status}: ${errorText.slice(0, 200)}`);
      }

      await response.json();

      // Update last_scanned_at for this batch
      const batchIds = batch.map((s) => s.id);
      await supabase
        .from('sources')
        .update({ last_scanned_at: scanTimestamp })
        .in('id', batchIds);

      results.push({ batch: batchNum, success: true, sources: batch.map((s) => s.name) });
      totalScanned += batch.length;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      log.error(`Batch ${batchNum} failed`, { error: msg });
      results.push({ batch: batchNum, success: false, sources: batch.map((s) => s.name), error: msg.slice(0, 200) });
    }
  }

  log.info('Phase 0 scan completed', { totalScanned, totalSources: activeSources.length });

  return NextResponse.json({
    success: totalScanned > 0,
    message: `Phase 0 scan completed. ${totalScanned}/${activeSources.length} sources scanned.`,
    sources_scanned: totalScanned,
    scan_timestamp: scanTimestamp,
    batch_results: results,
  });
}
