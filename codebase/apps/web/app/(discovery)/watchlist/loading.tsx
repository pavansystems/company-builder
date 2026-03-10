import { CardSkeleton } from '@/components/shared/LoadingSkeleton';

export default function WatchlistLoading() {
  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-52 rounded-lg shimmer" />
          <div className="h-4 w-96 rounded shimmer" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-lg shimmer" />
          <div className="h-9 w-28 rounded-lg shimmer" />
        </div>
      </div>

      {/* Filter bar */}
      <div className="h-14 rounded-xl border border-slate-200 bg-white shimmer" />

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 9 }).map((_, i) => (
          <CardSkeleton key={i} className="h-[280px]" />
        ))}
      </div>
    </div>
  );
}
