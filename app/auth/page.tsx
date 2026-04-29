'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';
  const [tab, setTab] = useState<'signin' | 'signup'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.get('error_description') || searchParams.get('error') || '');

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) router.push('/trends');
    };
    void checkSession();
  }, [router, supabase]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectTo = `${appUrl.replace(/\/$/, '')}/auth/callback`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (oauthError) {
      setError(
        `Google OAuth: ${oauthError.message}. Verifie les URLs de redirection dans Supabase (doit contenir ${redirectTo}).`
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/index" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent-foreground" />
          </div>
          <span className="font-bold text-xl">Peakly</span>
        </Link>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          <button
            onClick={() => setTab('signin')}
            className={`flex-1 py-3 font-semibold transition-colors ${
              tab === 'signin'
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 py-3 font-semibold transition-colors ${
              tab === 'signup'
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Sign In Form */}
        {tab === 'signin' && (
          <div className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-opacity font-semibold"
            >
              {loading ? 'Connexion en cours...' : 'Continuer avec Google'}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Authentification securisee via Supabase + Google OAuth.
            </p>
          </div>
        )}

        {/* Sign Up Form */}
        {tab === 'signup' && (
          <div className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-opacity font-semibold"
            >
              {loading ? 'Creation du compte...' : 'Creer un compte avec Google'}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Le plan Free est cree automatiquement. Upgrade vers Pro dans Alerts.
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          {tab === 'signin' ? 'Don&apos;t have an account?' : 'Already have an account?'}{' '}
          <button
            onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')}
            className="text-accent hover:underline font-semibold"
          >
            {tab === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground">
            Chargement...
          </div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
