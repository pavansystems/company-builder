import { Badge, type BadgeProps } from '@/components/ui/badge';

type StatusValue =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'gate_review'
  | 'go'
  | 'no_go'
  | 'conditional'
  | 'draft'
  | 'published'
  | 'archived'
  | 'approved'
  | 'rejected';

interface StatusBadgeProps {
  status: StatusValue;
  className?: string;
}

const statusConfig: Record<
  StatusValue,
  { label: string; variant: BadgeProps['variant'] }
> = {
  pending: { label: 'Pending', variant: 'slate' },
  in_progress: { label: 'In Progress', variant: 'blue' },
  completed: { label: 'Completed', variant: 'green' },
  failed: { label: 'Failed', variant: 'red' },
  blocked: { label: 'Blocked', variant: 'orange' },
  gate_review: { label: 'Gate Review', variant: 'violet' },
  go: { label: 'Go', variant: 'green' },
  no_go: { label: 'No Go', variant: 'red' },
  conditional: { label: 'Conditional', variant: 'amber' },
  draft: { label: 'Draft', variant: 'slate' },
  published: { label: 'Published', variant: 'teal' },
  archived: { label: 'Archived', variant: 'slate' },
  approved: { label: 'Approved', variant: 'green' },
  rejected: { label: 'Rejected', variant: 'red' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    variant: 'slate' as const,
  };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
