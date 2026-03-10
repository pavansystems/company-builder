import { MetricSkeleton, CardSkeleton, ChartSkeleton } from '@/components/shared/LoadingSkeleton';

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg shimmer" />
        <div className="h-4 w-72 rounded shimmer" />
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricSkeleton key={i} />
        ))}
      </div>

      {/* Phase nav + blocked alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="h-20 rounded-xl border border-slate-200 bg-white shimmer" />
        </div>
        <div className="h-20 rounded-xl border border-slate-200 bg-white shimmer" />
      </div>

      {/* Phase cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Table */}
      <CardSkeleton className="h-64" />
    </div>
  );
}
