'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  DollarSign,
  Bot,
  Rocket,
  Shield,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Blueprint } from '@company-builder/types';
import { BlueprintExportButton } from './BlueprintExportButton';

interface BlueprintNavProps {
  blueprint: Blueprint;
  blueprintId: string;
  conceptTitle?: string;
}

const NAV_SECTIONS = [
  {
    key: 'executive-summary',
    label: 'Executive Summary',
    icon: FileText,
    hasDataFn: (b: Blueprint) => !!b.executive_summary,
  },
  {
    key: 'business-model',
    label: 'Business Model',
    icon: DollarSign,
    hasDataFn: (b: Blueprint) => !!(b.revenue_model || (b.pricing_tiers && b.pricing_tiers.length > 0)),
  },
  {
    key: 'agent-architecture',
    label: 'Agent Architecture',
    icon: Bot,
    hasDataFn: (b: Blueprint) => !!(b.agent_roles && b.agent_roles.length > 0),
  },
  {
    key: 'gtm-plan',
    label: 'GTM Plan',
    icon: Rocket,
    hasDataFn: (b: Blueprint) => !!(b.gtm_target_segment || b.gtm_channels),
  },
  {
    key: 'risk-register',
    label: 'Risk Register',
    icon: Shield,
    hasDataFn: (b: Blueprint) => !!(b.risks && b.risks.length > 0),
  },
  {
    key: 'resource-plan',
    label: 'Resource Plan',
    icon: Calendar,
    hasDataFn: (b: Blueprint) => !!(b.hiring_plan || b.runway_months),
  },
] as const;

export function BlueprintNav({ blueprint, blueprintId, conceptTitle }: BlueprintNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col h-full bg-white border-r border-slate-200 w-[220px] shrink-0">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-100">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
          Blueprint
        </p>
        <p className="text-sm font-bold text-slate-900 line-clamp-2">
          {conceptTitle ?? 'Blueprint Viewer'}
        </p>
        {blueprint.is_finalized && (
          <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
            Finalized
          </span>
        )}
      </div>

      {/* Navigation links */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_SECTIONS.map(({ key, label, icon: Icon, hasDataFn }) => {
          const href = `/blueprint/${blueprintId}/sections/${key}`;
          const isActive = pathname.includes(`/sections/${key}`);
          const hasData = hasDataFn(blueprint);

          return (
            <Link
              key={key}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon
                className={cn('h-4 w-4 shrink-0', isActive ? 'text-emerald-600' : 'text-slate-400')}
              />
              <span className="flex-1 leading-tight">{label}</span>
              {hasData && (
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    isActive ? 'bg-emerald-500' : 'bg-emerald-300'
                  )}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Export button */}
      <div className="px-3 py-3 border-t border-slate-100">
        <BlueprintExportButton blueprint={blueprint} conceptTitle={conceptTitle ?? 'Blueprint'} />
      </div>
    </nav>
  );
}
