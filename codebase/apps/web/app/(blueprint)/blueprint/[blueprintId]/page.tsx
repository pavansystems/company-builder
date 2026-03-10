import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ blueprintId: string }>;
}

export default async function BlueprintRootPage({ params }: PageProps) {
  const { blueprintId } = await params;
  redirect(`/blueprint/${blueprintId}/sections/executive-summary`);
}
