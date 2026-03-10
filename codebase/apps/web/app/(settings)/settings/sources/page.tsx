import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SourcesTable } from '../components/SourcesTable';
import { Globe, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Content Sources | Settings' };

export default async function SourcesPage() {
  const supabase = await createServerSupabaseClient();

  const { data: sources } = await supabase
    .from('sources')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/settings" className="hover:text-slate-800 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Settings
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Content Sources</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100">
          <Globe className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Content Sources</h1>
          <p className="text-sm text-slate-500">
            Manage the RSS feeds, APIs, and web sources that signal detection agents scan.
          </p>
        </div>
      </div>

      <SourcesTable initialSources={sources ?? []} />
    </div>
  );
}
