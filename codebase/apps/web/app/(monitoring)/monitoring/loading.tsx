import { MetricSkeleton, CardSkeleton, ChartSkeleton } from '@/components/shared/LoadingSkeleton';

export default function MonitoringLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-lg shimmer" />
        <div className="h-4 w-80 rounded shimmer" />
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <MetricSkeleton key={i} />
        ))}
      </div>

      {/* Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Table */}
      <CardSkeleton className="h-96" />
    </div>
  );
}
