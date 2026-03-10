'use client';

import { usePathname } from 'next/navigation';
import { Bell, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbMap: Record<string, string> = {
    dashboard: 'Dashboard',
    watchlist: 'Watchlist',
    concepts: 'Concepts',
    validation: 'Validation',
    blueprint: 'Blueprint',
    settings: 'Settings',
    review: 'Review',
    'market-sizing': 'Market Sizing',
    competitive: 'Competitive',
    feasibility: 'Feasibility',
    economics: 'Economics',
    'scoring-thresholds': 'Scoring Thresholds',
    sources: 'Sources',
    notifications: 'Notifications',
  };

  const crumbs: { label: string; href: string }[] = [];
  let currentPath = '';

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = breadcrumbMap[segment] ?? segment;
    crumbs.push({ label, href: currentPath });
  }

  return crumbs;
}

export function TopBar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const breadcrumbs = getBreadcrumbs(pathname);

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'CB';

  async function handleSignOut() {
    await signOut();
    router.push('/auth/login');
  }

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-slate-200 bg-white shrink-0">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-slate-900">{crumb.label}</span>
            ) : (
              <span className="text-slate-500 hover:text-slate-700 cursor-pointer transition-colors">
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4 text-slate-600" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 px-2 gap-2 text-sm font-medium text-slate-700"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-slate-200 text-slate-700">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block max-w-[120px] truncate">
                {user?.email ?? 'User'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              className="text-sm"
              onClick={() => router.push('/settings')}
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-sm text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={handleSignOut}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
