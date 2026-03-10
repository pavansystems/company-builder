import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { BlueprintPackagerAgent } from '@company-builder/agents';
import type { AgentInput } from '@company-builder/types';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isCronRequest =
    cronSecret !== undefined &&
    cronSecret.length > 0 &&
    authHeader === `Bearer ${cronSecret}`;

  if (!isCronRequest) {
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

  const agent = new BlueprintPackagerAgent({
    name: 'blueprint-packager',
    description:
      'Synthesizes all Phase 3 outputs into the final company blueprint: executive summary, key metrics, investment thesis, top risks, and readiness score.',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    maxTokens: 8192,
  });

  try {
    const output = await agent.run(input);
    return NextResponse.json(output);
  } catch (error) {
    console.error('[blueprint-packager] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
