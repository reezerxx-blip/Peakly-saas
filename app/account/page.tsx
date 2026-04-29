'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/navigation';
import { PremiumPageShell } from '@/components/ui/premium-page-shell';
import { LiveIndicator } from '@/components/ui/live-indicator';
import { CountUp } from '@/components/ui/count-up';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { SectionError } from '@/components/ui/async-state';
import { Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Tool = { id: string; name: string; category: string };

type Preferences = {
  theme: 'dark' | 'system';
  language: 'fr' | 'en';
  email_alerts_enabled: boolean;
};

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [user, setUser] = useState<{ email?: string; fullName?: string; plan?: 'free' | 'pro' } | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [favorites, setFavorites] = useState<Array<{ id: string; tool_id: string; created_at: string }>>([]);
  const [toolId, setToolId] = useState('');
  const [alertsCount, setAlertsCount] = useState(0);
  const [preferences, setPreferences] = useState<Preferences>({
    theme: 'dark',
    language: 'fr',
    email_alerts_enabled: true,
  });

  const favoriteToolNames = useMemo(() => {
    const map = new Map(tools.map((t) => [t.id, t]));
    return favorites.map((f) => ({ ...f, tool: map.get(f.tool_id) }));
  }, [favorites, tools]);

  const memberSinceDays = 30; // placeholder until created_at is exposed in /api/me

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [meRes, toolsRes, favRes, prefRes, alertsRes] = await Promise.all([
        fetch('/api/me'),
        fetch('/api/tools'),
        fetch('/api/account/favorites'),
        fetch('/api/account/preferences'),
        fetch('/api/alerts'),
      ]);

      if (meRes.ok) {
        const me = (await meRes.json()) as { user?: { email?: string; fullName?: string; plan?: 'free' | 'pro' } };
        setUser(me.user ?? null);
      } else {
        setLoadError('Impossible de charger votre profil.');
      }
      if (toolsRes.ok) {
        const payload = (await toolsRes.json()) as { tools: Tool[] };
        setTools(payload.tools ?? []);
        if (!toolId && payload.tools?.length) setToolId(payload.tools[0].id);
      }
      if (favRes.ok) {
        const payload = (await favRes.json()) as { favorites: Array<{ id: string; tool_id: string; created_at: string }> };
        setFavorites(payload.favorites ?? []);
      }
      if (prefRes.ok) {
        const payload = (await prefRes.json()) as { preferences: Preferences };
        setPreferences(payload.preferences);
      }
      if (alertsRes.ok) {
        const payload = (await alertsRes.json()) as { alerts: unknown[] };
        setAlertsCount((payload.alerts ?? []).length);
      }
    } catch {
      setLoadError('Le chargement du compte a echoue. Merci de reessayer.');
    } finally {
      setLoading(false);
    }
  }, [toolId]);

  useEffect(() => {
    void load();
  }, [load]);

  const savePreferences = async () => {
    const res = await fetch('/api/account/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    });
    if (!res.ok) {
      toast({
        title: 'Sauvegarde impossible',
        description: 'Impossible de sauvegarder les preferences.',
      });
      return;
    }
    document.cookie = `lang=${preferences.language}; path=/; max-age=31536000; SameSite=Lax`;
    toast({
      title: 'Preferences sauvegardees',
      description: 'Vos preferences sont bien enregistrees.',
    });
  };

  const addFavorite = async () => {
    if (!toolId) return;
    const res = await fetch('/api/account/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId }),
    });
    if (!res.ok) {
      toast({
        title: 'Ajout impossible',
        description: 'Impossible d ajouter aux favoris.',
      });
      return;
    }
    await load();
    toast({
      title: 'Favori ajoute',
      description: 'L outil est maintenant dans vos favoris.',
    });
  };

  const removeFavorite = async (targetToolId: string) => {
    const res = await fetch(`/api/account/favorites?toolId=${encodeURIComponent(targetToolId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      toast({
        title: 'Suppression impossible',
        description: 'Impossible de supprimer ce favori.',
      });
      return;
    }
    await load();
    toast({
      title: 'Favori supprime',
      description: 'Ce favori a bien ete retire.',
    });
  };

  return (
    <PremiumPageShell>
      <Navigation />
      <div className="container mx-auto px-4 py-7 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="premium-hero-title text-[52px] font-extrabold leading-[1.05] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
              Espace utilisateur
            </h1>
            <p className="premium-subtitle text-white/50 text-base">Parametres du site, favoris et preferences</p>
          </div>
          <LiveIndicator />
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d0d1a] p-5 premium-card">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent/20 border border-accent/40 grid place-items-center text-lg font-bold text-accent-foreground">
              {(user?.fullName || user?.email || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-bold text-white">{user?.fullName || 'Utilisateur'}</p>
              <p className="text-sm text-white/50">{user?.email || 'Non connecte'}</p>
            </div>
            <span className={`ml-auto px-3 py-1 rounded-full text-xs ${user?.plan === 'pro' ? 'bg-[#ffaa0020] border border-[#ffaa00] text-[#ffaa00]' : 'bg-white/10 text-white/70 border border-white/15'}`}>
              {user?.plan === 'pro' ? 'Premium' : 'Free'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-[#0d0d1a] p-4">
            <p className="text-white/40 text-sm">Outils suivis</p>
            <p className="text-3xl font-bold text-accent"><CountUp value={favorites.length} /></p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0d0d1a] p-4">
            <p className="text-white/40 text-sm">Alertes actives</p>
            <p className="text-3xl font-bold text-accent"><CountUp value={alertsCount} /></p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0d0d1a] p-4">
            <p className="text-white/40 text-sm">Membre depuis</p>
            <p className="text-3xl font-bold text-accent"><CountUp value={memberSinceDays} />j</p>
          </div>
        </div>

        {loadError && (
          <SectionError
            title="Erreur de chargement"
            description={loadError}
            onRetry={() => void load()}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-[#0d0d1a] p-5 premium-card space-y-4">
            <h2 className="text-xl font-bold">Parametres du site</h2>
            <div className="space-y-3">
              <label className="block text-sm text-white/60">Langue</label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences((p) => ({ ...p, language: e.target.value as 'fr' | 'en' }))}
                className="w-full h-10 rounded-lg bg-[#080810] border border-white/15 px-3"
              >
                <option value="fr">Francais</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-sm text-white/60">Theme</label>
              <select
                value={preferences.theme}
                onChange={(e) => setPreferences((p) => ({ ...p, theme: e.target.value as 'dark' | 'system' }))}
                className="w-full h-10 rounded-lg bg-[#080810] border border-white/15 px-3"
              >
                <option value="dark">Dark</option>
                <option value="system">Systeme</option>
              </select>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={preferences.email_alerts_enabled}
                onChange={(e) => setPreferences((p) => ({ ...p, email_alerts_enabled: e.target.checked }))}
              />
              Recevoir les alertes email
            </label>
            <button onClick={savePreferences} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-semibold">
              Sauvegarder
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d0d1a] p-5 premium-card space-y-4">
            <h2 className="text-xl font-bold">Favoris</h2>
            <div className="flex gap-2">
              <select
                value={toolId}
                onChange={(e) => setToolId(e.target.value)}
                className="flex-1 h-10 rounded-lg bg-[#080810] border border-white/15 px-3"
              >
                {tools.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.name}
                  </option>
                ))}
              </select>
              <button onClick={addFavorite} className="px-3 h-10 rounded-lg bg-accent text-accent-foreground font-semibold">
                Ajouter
              </button>
            </div>
            {loading ? (
              <p className="text-white/50 text-sm">Chargement...</p>
            ) : favoriteToolNames.length === 0 ? (
              <Empty className="border border-white/10 bg-[#080810]">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Star className="h-5 w-5" />
                  </EmptyMedia>
                  <EmptyTitle>Pas encore de favoris</EmptyTitle>
                  <EmptyDescription>
                    Ajoutez vos premiers outils suivis pour construire votre espace personnel.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Link
                      href="/trends"
                      className="inline-flex items-center rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground"
                    >
                      Ajouter depuis les tendances
                    </Link>
                    <Link
                      href="/getting-started"
                      className="inline-flex items-center rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white/90"
                    >
                      Guide de demarrage
                    </Link>
                  </div>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="space-y-2">
                {favoriteToolNames.map((fav) => (
                  <div key={fav.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-[#080810] p-3">
                    <div>
                      <p className="text-white font-medium">{fav.tool?.name ?? fav.tool_id}</p>
                      <p className="text-xs text-white/45">{fav.tool?.category ?? '-'}</p>
                    </div>
                    <button
                      onClick={() => removeFavorite(fav.tool_id)}
                      className="px-2 py-1 rounded-md border border-white/20 text-xs text-white/70 hover:bg-white/5"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </PremiumPageShell>
  );
}
