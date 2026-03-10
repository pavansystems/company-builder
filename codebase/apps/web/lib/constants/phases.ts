export const PHASES = [
  {
    id: 0,
    key: 'discovery',
    label: 'Discovery',
    icon: 'Telescope',
    color: '#0D9488',
    bgClass: 'bg-teal-600',
    textClass: 'text-teal-600',
    borderClass: 'border-teal-600',
  },
  {
    id: 1,
    key: 'ideation',
    label: 'Ideation',
    icon: 'Lightbulb',
    color: '#7C3AED',
    bgClass: 'bg-violet-600',
    textClass: 'text-violet-600',
    borderClass: 'border-violet-600',
  },
  {
    id: 2,
    key: 'validation',
    label: 'Validation',
    icon: 'FlaskConical',
    color: '#D97706',
    bgClass: 'bg-amber-600',
    textClass: 'text-amber-600',
    borderClass: 'border-amber-600',
  },
  {
    id: 3,
    key: 'blueprint',
    label: 'Blueprint',
    icon: 'FileText',
    color: '#059669',
    bgClass: 'bg-emerald-600',
    textClass: 'text-emerald-600',
    borderClass: 'border-emerald-600',
  },
] as const;

export type PhaseKey = (typeof PHASES)[number]['key'];
export type PhaseId = (typeof PHASES)[number]['id'];
