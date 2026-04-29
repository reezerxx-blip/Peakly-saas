'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/navigation';
import { AlertCircle, Bell, Filter } from 'lucide-react';
import { PaywallBlur } from '@/components/paywall-blur';
import { PremiumPageShell } from '@/components/ui/premium-page-shell';
import { LiveIndicator } from '@/components/ui/live-indicator';
import { PremiumBlur } from '@/components/ui/premium-blur';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { SectionError, SectionLoading } from '@/components/ui/async-state';
import { NewsFeed } from '@/components/news-feed';
import type { Tool } from '@/lib/data';
import { getClientLanguage } from '@/lib/i18n-client';
import type { Language } from '@/lib/i18n-types';
import { toast } from '@/hooks/use-toast';
import { inferToolTraits } from '@/lib/tool-discovery';

export default function AlertsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [toolId, setToolId] = useState('');
  const [threshold, setThreshold] = useState(15);
  const [alerts, setAlerts] = useState<
    Array<{ id: string; tool_id: string; threshold_percent: number; active: boolean }>
  >([]);
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [lang, setLang] = useState<Language>('fr');
  const [watchKeyword, setWatchKeyword] = useState('');
  const [watchKeywords, setWatchKeywords] = useState<string[]>([]);
  const [watchCategory, setWatchCategory] = useState<string>('all');

  const toolMap = useMemo(() => new Map(tools.map((tool) => [tool.id, tool.name])), [tools]);
  const categories = useMemo(() => Array.from(new Set(tools.map((tool) => tool.category))).sort(), [tools]);
  const radarEvents = useMemo(() => {
    const scoped = tools
      .filter((tool) => (watchCategory === 'all' ? true : tool.category === watchCategory))
      .slice()
      .sort((a, b) => b.metrics.monthlyGrowth - a.metrics.monthlyGrowth)
      .slice(0, 8)
      .map((tool, index) => {
        const traits = inferToolTraits(tool);
        const eventType = index % 3 === 0 ? 'pricing' : index % 2 === 0 ? 'feature' : 'momentum';
        const eventLabel =
          eventType === 'pricing'
            ? lang === 'fr'
              ? 'Signal pricing detecte'
              : 'Pricing signal detected'
            : eventType === 'feature'
              ? lang === 'fr'
                ? 'Nouvelles fonctionnalites detectees'
                : 'New features detected'
              : lang === 'fr'
                ? 'Hausse de momentum'
                : 'Momentum increase';
        return {
          id: `${tool.id}-${eventType}`,
          toolName: tool.name,
          category: tool.category,
          score: tool.trendingScore,
          growth: tool.metrics.monthlyGrowth,
          eventLabel,
          traits,
        };
      });
    return scoped;
  }, [tools, watchCategory, lang]);

  const loadData = useCallback(async () => {
    setLoadError('');
    try {
      const [toolsResponse, meResponse, alertsResponse] = await Promise.all([
        fetch('/api/tools'),
        fetch('/api/me'),
        fetch('/api/alerts'),
      ]);

      if (toolsResponse.ok) {
        const toolsPayload = (await toolsResponse.json()) as { tools: Tool[] };
        setTools(toolsPayload.tools);
        if (!toolId && toolsPayload.tools.length > 0) {
          setToolId(toolsPayload.tools[0].id);
        }
      }

      if (meResponse.ok) {
        const mePayload = (await meResponse.json()) as { user?: { plan?: 'free' | 'pro' } };
        setPlan(mePayload.user?.plan ?? 'free');
      }

      if (alertsResponse.ok) {
        const payload = (await alertsResponse.json()) as {
          alerts: Array<{ id: string; tool_id: string; threshold_percent: number; active: boolean }>;
        };
        setAlerts(payload.alerts);
      } else {
        const errorPayload = (await alertsResponse.json()) as { error?: string; setupHint?: string };
        setLoadError(
          errorPayload.setupHint ??
            errorPayload.error ??
            'Impossible de charger vos alertes pour le moment.'
        );
      }
    } catch {
      setLoadError('Le chargement a echoue. Verifie votre connexion puis reessayez.');
    } finally {
      setInitialLoading(false);
    }
  }, [toolId]);

  useEffect(() => {
    setLang(getClientLanguage());
    void loadData();
  }, [loadData]);

  const handleCreateAlert = async () => {
    setSaving(true);
    const response = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId, thresholdPercent: threshold }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      toast({
        title: 'Creation impossible',
        description: payload.error ?? 'Impossible de creer l alerte.',
      });
      setSaving(false);
      return;
    }

    toast({
      title: 'Alerte creee',
      description: 'Votre alerte est active et sera surveillee automatiquement.',
    });
    setThreshold(15);
    await loadData();
    setSaving(false);
  };

  const handleUpgrade = async () => {
    setSaving(true);
    const response = await fetch('/api/checkout', { method: 'POST' });
    const payload = (await response.json()) as { checkoutUrl?: string; error?: string };
    if (!response.ok || !payload.checkoutUrl) {
      toast({
        title: 'Checkout indisponible',
        description: payload.error ?? 'Erreur de checkout Lemon Squeezy.',
      });
      setSaving(false);
      return;
    }
    window.location.href = payload.checkoutUrl;
  };

  const handleAddKeyword = () => {
    const normalized = watchKeyword.trim().toLowerCase();
    if (!normalized) return;
    if (watchKeywords.includes(normalized)) return;
    setWatchKeywords((prev) => [...prev, normalized].slice(-8));
    setWatchKeyword('');
  };

  return (
    <PremiumPageShell>
      <Navigation />
      <div className="container mx-auto px-4 py-7">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="premium-hero-title text-[52px] font-extrabold leading-[1.05] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
                {lang === 'fr' ? 'Alertes & Signaux' : 'Alerts & Signals'}
              </h1>
              <p className="premium-subtitle text-white/50 text-base">
                {lang === 'fr'
                  ? 'Soyez le premier informe des tendances'
                  : 'Be first to know about trend shifts'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs bg-[#ffaa0020] border border-[#ffaa00] text-[#ffaa00]">
                Premium
              </span>
              <LiveIndicator />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            <PaywallBlur requiresPro={true} feature="Smart alerts">
              {initialLoading ? (
                <SectionLoading rows={4} />
              ) : loadError ? (
                <SectionError
                  title="Chargement indisponible"
                  description={loadError}
                  onRetry={() => {
                    setInitialLoading(true);
                    void loadData();
                  }}
                />
              ) : (
              <div className="space-y-6">
                {/* Alert Setup Form */}
                <div className="rounded-2xl border border-white/10 bg-[#0d0d1a] p-6 premium-card">
                  <h2 className="text-xl font-bold mb-4">Creer une nouvelle alerte</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Nom de l outil</label>
                      <select
                        value={toolId}
                        onChange={(event) => setToolId(event.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-accent"
                      >
                        {tools.map((tool) => (
                          <option key={tool.id} value={tool.id}>
                            {tool.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Threshold (% de trafic)
                        </label>
                        <input
                          type="number"
                          value={threshold}
                          onChange={(event) => setThreshold(Number(event.target.value))}
                          min={1}
                          className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Un email est envoye quand l outil depasse ce seuil.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleCreateAlert}
                      disabled={saving || !toolId}
                      className="w-full px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity font-semibold disabled:opacity-50"
                    >
                      {saving ? 'Creation...' : 'Creer l alerte'}
                    </button>
                    {plan !== 'pro' && (
                      <button
                        onClick={handleUpgrade}
                        disabled={saving}
                        className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-semibold disabled:opacity-50"
                      >
                        Passer en Pro - 9EUR/mois
                      </button>
                    )}
                  </div>
                </div>

                {/* Active Alerts */}
                <div className="rounded-2xl border border-white/10 bg-[#0d0d1a] p-6 premium-card">
                  <h2 className="text-xl font-bold mb-4">Mes alertes ({alerts.length})</h2>
                  <div className="space-y-3">
                    {alerts.length === 0 && (
                      <Empty className="border border-white/10 bg-[#080810]">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Bell className="h-5 w-5" />
                          </EmptyMedia>
                          <EmptyTitle>Aucune alerte active</EmptyTitle>
                          <EmptyDescription>
                            Creez votre premiere alerte pour recevoir un signal quand un outil depasse votre seuil.
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Link
                            href="/trends"
                            className="inline-flex items-center rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground"
                          >
                            Explorer les tendances
                          </Link>
                        </EmptyContent>
                      </Empty>
                    )}
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-[#0d0d1a] border border-white/10"
                        style={{ animation: `premiumAlertIn 420ms ease-out both` }}
                      >
                        <div>
                          <p className="font-semibold text-foreground">
                            {toolMap.get(alert.tool_id) ?? alert.tool_id}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Seuil trafic: +{alert.threshold_percent}%
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            alert.active
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-white/5 text-white/45'
                          }`}
                        >
                          {alert.active ? 'Active' : 'Pausee'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0d0d1a] p-6 premium-card space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">{lang === 'fr' ? 'AI Radar' : 'AI Radar'}</h2>
                    <span className="px-2 py-1 rounded-full text-xs border border-[#00ccff40] bg-[#00ccff15] text-[#00ccff]">
                      {lang === 'fr' ? 'Veille continue' : 'Continuous monitoring'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr,200px] gap-3">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold">{lang === 'fr' ? 'Mots-cles surveilles' : 'Tracked keywords'}</label>
                      <div className="flex gap-2">
                        <input
                          value={watchKeyword}
                          onChange={(event) => setWatchKeyword(event.target.value)}
                          placeholder={lang === 'fr' ? 'ex: support client, llm ops...' : 'e.g. customer support, llm ops...'}
                          className="w-full rounded-lg border border-white/15 bg-background px-3 py-2 text-sm"
                        />
                        <button
                          onClick={handleAddKeyword}
                          className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:border-accent"
                        >
                          +
                        </button>
                      </div>
                      {watchKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {watchKeywords.map((keyword) => (
                            <span key={keyword} className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/80">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">{lang === 'fr' ? 'Categorie suivie' : 'Tracked category'}</label>
                      <select
                        value={watchCategory}
                        onChange={(event) => setWatchCategory(event.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-background px-3 py-2 text-sm"
                      >
                        <option value="all">{lang === 'fr' ? 'Toutes categories' : 'All categories'}</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {radarEvents.map((event) => (
                      <div key={event.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-white text-sm">{event.toolName}</p>
                          <span className="text-xs text-[#00ff88]">+{Number(event.growth).toFixed(2)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {event.eventLabel} • {event.category} • {event.traits.aiType}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0d0d1a] p-2 premium-card">
                  <NewsFeed lang={lang} mode="radar" keywords={watchKeywords} />
                </div>
              </div>
              )}
            </PaywallBlur>
          </div>

          {/* Sidebar - Features preview */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-bold text-lg">Fonctionnalites premium</h3>

            <PremiumBlur locked={plan !== 'pro'} ctaHref="/alerts">
              <div className="space-y-3">
              {[
                {
                  icon: Bell,
                  title: 'Alertes personnalisees',
                  description: 'Recevez des notifications sur les changements de tendance',
                },
                {
                  icon: AlertCircle,
                  title: 'Detection des signaux',
                  description: 'Reperez les signaux de rupture plus tot',
                },
                {
                  icon: Filter,
                  title: 'Filtres avances',
                  description: 'Filtrez par categorie et metriques',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-4 rounded-xl bg-[#0d0d1a] border border-white/10 hover:border-accent transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <feature.icon className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">{feature.title}</p>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </PremiumBlur>
          </div>
        </div>
      </div>
    </PremiumPageShell>
  );
}
