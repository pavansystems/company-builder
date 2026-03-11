import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

interface LoginPageProps {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}

const errorMessages: Record<string, string> = {
  auth_callback_error: 'Authentication failed. Please try again.',
  auth_callback_failed: 'Authentication callback failed. Please try again.',
  session_expired: 'Your session has expired. Please sign in again.',
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorMessage = params.error ? errorMessages[params.error] ?? 'An error occurred. Please try again.' : null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Wordmark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">CB</span>
            </div>
            <span className="text-xl font-bold text-slate-900">Company Builder</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          {errorMessage && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
              {errorMessage}
            </div>
          )}

          <LoginForm />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Or continue with</span>
            </div>
          </div>

          <OAuthButtons />

          <div className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/signup"
              className="text-teal-600 font-medium hover:text-teal-700 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
