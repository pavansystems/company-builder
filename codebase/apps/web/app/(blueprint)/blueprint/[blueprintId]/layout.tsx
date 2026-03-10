import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { BlueprintNav } from '../components/BlueprintNav';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ blueprintId: string }>;
}

export default async function BlueprintDetailLayout({ children, params }: LayoutProps) {
  const { blueprintId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: blueprint } = await supabase
    .from('blueprints')
    .select('*')
    .eq('id', blueprintId)
    .single();

  if (!blueprint) notFound();

  const { data: concept } = await supabase
    .from('concepts')
    .select('id, title')
    .eq('id', blueprint.concept_id)
    .single();

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sticky left nav */}
      <div className="hidden md:flex h-full sticky top-0 overflow-y-auto">
        <BlueprintNav
          blueprint={blueprint as any}
          blueprintId={blueprintId}
          {...(concept?.title !== undefined ? { conceptTitle: concept.title } : {})}
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
