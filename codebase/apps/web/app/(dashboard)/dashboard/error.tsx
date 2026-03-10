'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 mb-5">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Dashboard failed to load</h2>
      <p className="text-sm text-slate-500 max-w-sm mb-1">
        {error.message || 'An unexpected error occurred while loading the dashboard.'}
      </p>
      {error.digest && (
        <p className="text-xs text-slate-400 font-mono mb-6">Error ID: {error.digest}</p>
      )}
      <Button
        onClick={reset}
        className="flex items-center gap-2 mt-4"
        variant="default"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
