import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { WatchlistPublisherAgent } from '@company-builder/agents';
import type { AgentInput } from '@company-builder/types';
import { handleAgentError } from '../_shared/errorHandler';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Check for Vercel cron secret first (allows cron to bypass user auth)
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isCronRequest =
    cronSecret !== undefined &&
    cronSecret.length > 0 &&
    authHeader === `Bearer ${cronSecret}`;

  if (!isCronRequest) {
    // Require authenticated user for non-cron requests
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let input: AgentInput;
  try {
    input = (await request.json()) as AgentInput;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const agent = new WatchlistPublisherAgent({
    name: 'watchlist-publisher',
    description:
      'Packages the top-ranked opportunities into a versioned watchlist snapshot with LLM-generated editorial summary.',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  });

  try {
    const output = await agent.run(input);
    return NextResponse.json(output);
  } catch (error) {
    console.error('[watchlist-publisher] Error:', error);
    return handleAgentError(error);
  }
}
