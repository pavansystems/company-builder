import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  // If called via fetch (AJAX), return JSON so the client can handle navigation
  const accept = request.headers.get('accept') ?? '';
  if (accept.includes('application/json')) {
    return NextResponse.json({ success: true });
  }

  // For form submissions or direct navigation, redirect to login
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/auth/login`, { status: 302 });
}

// Also support GET for simple link-based logout
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(`${origin}/auth/login`, { status: 302 });
}
