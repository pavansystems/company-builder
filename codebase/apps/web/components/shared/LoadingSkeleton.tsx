import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-6 space-y-4',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3.5 w-3/5" />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({
  cols = 5,
  className,
}: {
  cols?: number;
  className?: string;
}) {
  return (
    <tr className={cn('border-b border-slate-100', className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton
            className={cn(
              'h-4 rounded',
              i === 0 ? 'w-32' : i === cols - 1 ? 'w-16' : 'w-24'
            )}
          />
        </td>
      ))}
    </tr>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-6',
        className
      )}
    >
      <div className="space-y-2 mb-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3.5 w-48" />
      </div>
      <Skeleton className="h-52 w-full rounded-lg" />
    </div>
  );
}

export function MetricSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-5 space-y-3',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}
