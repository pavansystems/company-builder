'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Telescope,
  Lightbulb,
  FlaskConical,
  FileText,
  Settings,
  ShieldCheck,
  Monitor,
  ChevronLeft,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
  phaseColor?: string;
  phaseBorderClass?: string;
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Phase 0: Discovery',
    phaseColor: '#0D9488',
    phaseBorderClass: 'border-teal-500',
    items: [
      { href: '/watchlist', label: 'Watchlist', icon: Telescope },
    ],
  },
  {
    title: 'Phase 1: Ideation',
    phaseColor: '#7C3AED',
    phaseBorderClass: 'border-violet-500',
    items: [
      { href: '/concepts', label: 'Concepts', icon: Lightbulb },
    ],
  },
  {
    title: 'Phase 2: Validation',
    phaseColor: '#D97706',
    phaseBorderClass: 'border-amber-500',
    items: [
      { href: '/validation', label: 'Validation', icon: FlaskConical },
    ],
  },
  {
    title: 'Phase 3: Blueprint',
    phaseColor: '#059669',
    phaseBorderClass: 'border-emerald-500',
    items: [
      { href: '/blueprint', label: 'Blueprint', icon: FileText },
    ],
  },
  {
    title: 'Operations',
    phaseColor: '#EA580C',
    phaseBorderClass: 'border-orange-500',
    items: [
      { href: '/review', label: 'Review Queue', icon: ShieldCheck, badgeKey: 'review' },
      { href: '/monitoring', label: 'Monitoring', icon: Monitor },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetch('/api/pipeline/review')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.count === 'number') {
          setReviewCount(data.count);
        }
      })
      .catch(() => {
        // Silently ignore errors fetching review count
      });
  }, [pathname]);

  async function handleSignOut() {
    await signOut();
    // Also call the server-side logout route to clear cookies
    await fetch('/auth/logout', { method: 'POST' });
    router.push('/auth/login');
  }

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'CB';

  return (
    <aside
      className={cn(
        'flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-violet-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs">CB</span>
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm text-white truncate">
            Company Builder
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            {!collapsed && (
              <div
                className={cn(
                  'px-4 mb-2 flex items-center gap-2',
                  section.phaseBorderClass && 'border-l-2 ml-0 pl-3',
                  section.phaseBorderClass
                )}
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </span>
              </div>
            )}
            <ul className="space-y-0.5 px-2">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors group',
                        isActive
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive
                            ? section.phaseColor
                              ? ''
                              : 'text-white'
                            : 'text-slate-500 group-hover:text-slate-300'
                        )}
                        style={
                          isActive && section.phaseColor
                            ? { color: section.phaseColor }
                            : undefined
                        }
                      />
                      {!collapsed && (
                        <>
                          <span
                            className={cn(
                              'truncate',
                              isActive && section.phaseColor
                                ? ''
                                : ''
                            )}
                            style={
                              isActive && section.phaseColor
                                ? { color: section.phaseColor }
                                : undefined
                            }
                          >
                            {item.label}
                          </span>
                          {item.badgeKey === 'review' && reviewCount > 0 && (
                            <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold bg-orange-500 text-white">
                              {reviewCount}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-800 p-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg p-2 hover:bg-slate-800 transition-colors',
            collapsed ? 'justify-center' : ''
          )}
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={undefined} />
            <AvatarFallback className="bg-slate-700 text-slate-200 text-xs">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">
                {user?.email ?? 'User'}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleSignOut}
              className="text-slate-500 hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <div className="border-t border-slate-800 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
