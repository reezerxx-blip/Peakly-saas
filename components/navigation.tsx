'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, TrendingUp } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getClientLanguage } from '@/lib/i18n-client';
import type { Language } from '@/lib/i18n-types';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function Navigation() {
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [lang, setLang] = useState<Language>('fr');

  const isActive = (path: string) => pathname.startsWith(path);

  useEffect(() => {
    setLang(getClientLanguage());
    const load = async () => {
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
    void load();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setIsPro(false);
    window.location.href = '/auth';
  };

  const switchLanguage = (nextLang: Language) => {
    document.cookie = `lang=${nextLang}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  };

  const navItems = [
    { href: '/trends', labelFr: 'Tendances', labelEn: 'Trends' },
    { href: '/bubbles', labelFr: 'Bulles', labelEn: 'Bubbles' },
    { href: '/categories', labelFr: 'Categories', labelEn: 'Categories' },
    { href: '/alerts', labelFr: 'Alertes', labelEn: 'Alerts' },
    ...(isAuthenticated ? [{ href: '/account', labelFr: 'Compte', labelEn: 'Account' }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent-foreground" />
          </div>
          <span className="text-foreground">Peakly</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors ${
                isActive(item.href)
                  ? 'text-accent font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {lang === 'fr' ? item.labelFr : item.labelEn}
            </Link>
          ))}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => switchLanguage('fr')}
              className={`px-2 py-1 rounded ${lang === 'fr' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              FR
            </button>
            <button
              onClick={() => switchLanguage('en')}
              className={`px-2 py-1 rounded ${lang === 'en' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              EN
            </button>
          </div>
          {isPro && <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">PRO</span>}
          {isAuthenticated ? (
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {lang === 'fr' ? 'Deconnexion' : 'Sign Out'}
            </button>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {lang === 'fr' ? 'Connexion' : 'Sign In'}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => switchLanguage('fr')}
              className={`px-2 py-1 rounded ${lang === 'fr' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              FR
            </button>
            <button
              onClick={() => switchLanguage('en')}
              className={`px-2 py-1 rounded ${lang === 'en' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              EN
            </button>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground"
                aria-label={lang === 'fr' ? 'Ouvrir le menu' : 'Open menu'}
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[82%] border-border bg-card">
              <SheetHeader>
                <SheetTitle>Peakly</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-4">
                <div className="mb-4 space-y-2">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className={`block rounded-md px-3 py-2 ${
                          isActive(item.href)
                            ? 'bg-accent/15 text-accent'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {lang === 'fr' ? item.labelFr : item.labelEn}
                      </Link>
                    </SheetClose>
                  ))}
                </div>
                {isPro && (
                  <span className="mb-3 inline-flex text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">PRO</span>
                )}
                {isAuthenticated ? (
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    {lang === 'fr' ? 'Deconnexion' : 'Sign Out'}
                  </button>
                ) : (
                  <SheetClose asChild>
                    <Link
                      href="/auth"
                      className="block w-full px-4 py-2 text-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      {lang === 'fr' ? 'Connexion' : 'Sign In'}
                    </Link>
                  </SheetClose>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
