'use client';

import { useEffect, useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function PaywallBlur({
  children,
  requiresPro = false,
  feature = 'This feature',
}: {
  children: React.ReactNode;
  requiresPro?: boolean;
  feature?: string;
}) {
  const [isPro, setIsPro] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setMounted(true);
      const response = await fetch('/api/me');
      if (!response.ok) {
        setIsAuthenticated(false);
        setIsPro(false);
        return;
      }
      const payload = (await response.json()) as { user?: { plan?: string } };
      setIsAuthenticated(true);
      setIsPro(payload.user?.plan === 'pro');
    };
    void loadProfile();
  }, []);

  if (!mounted) return null;

  if (requiresPro && !isPro) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Premium Feature</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {feature} is available to Peakly Pro subscribers.
            </p>
            {isAuthenticated ? (
              <Link
                href="/alerts"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity text-sm font-semibold"
              >
                Upgrade to Pro
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/auth?tab=signup"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity text-sm font-semibold"
              >
                Sign in to upgrade
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
