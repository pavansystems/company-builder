import { AppShell } from '@/components/layout/AppShell';

export default function BlueprintLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
