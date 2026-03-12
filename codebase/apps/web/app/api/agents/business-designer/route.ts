import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { BusinessDesignerAgent } from '@company-builder/agents';
import type { AgentInput } from '@company-builder/types';
import { handleAgentError } from '../_shared/errorHandler';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isCronRequest =
    cronSecret !== undefined &&
    cronSecret.length > 0 &&
    authHeader === `Bearer ${cronSecret}`;

  let userId: string | undefined;
  if (!isCronRequest) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = user.id;
  }

  let input: AgentInput;
  try {
    input = (await request.json()) as AgentInput;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // For user-initiated requests, override account_id with the authenticated user's ID
  if (userId) {
    input.account_id = userId;
  }

  const agent = new BusinessDesignerAgent({
    name: 'business-designer',
    description:
      'Translates a validated AI-first concept into a coherent, financially-sound business model with revenue streams, pricing tiers, and 12-month financial projections.',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    modelId: 'claude-sonnet-4-6',
    maxTokens: 16384,
  });

  try {
    const output = await agent.run(input);
    return NextResponse.json(output);
  } catch (error) {
    console.error('[business-designer] Error:', error);
    return handleAgentError(error);
  }
}
