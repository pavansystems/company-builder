import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <p className="text-6xl font-black text-slate-200">404</p>
        <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
        <p className="text-slate-500">The page you are looking for does not exist.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
