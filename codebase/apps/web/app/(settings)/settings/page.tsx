import Link from 'next/link';
import { Settings, SlidersHorizontal, Globe, ChevronRight } from 'lucide-react';

export const metadata = { title: 'Settings | Company Builder' };

const SETTINGS_LINKS = [
  {
    href: '/settings/scoring-thresholds',
    icon: SlidersHorizontal,
    title: 'Scoring Thresholds',
    description: 'Configure gate rules, automatic advancement thresholds, and review bands per pipeline phase.',
    color: 'text-violet-600',
    bg: 'bg-violet-100',
  },
  {
    href: '/settings/sources',
    icon: Globe,
    title: 'Content Sources',
    description: 'Manage RSS feeds, APIs, and web sources used by the signal detection agents.',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
];

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100">
          <Settings className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">
            Configure platform behavior, gate rules, and content sources.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {SETTINGS_LINKS.map(({ href, icon: Icon, title, description, color, bg }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 p-5 rounded-xl border border-slate-200 bg-white hover:shadow-md hover:border-slate-300 transition-all duration-150 group"
          >
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bg} shrink-0`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 group-hover:text-slate-700">{title}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
