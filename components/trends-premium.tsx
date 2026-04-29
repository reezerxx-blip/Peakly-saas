'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { AppTool } from '@/lib/get-tools';
import type { Language } from '@/lib/i18n-types';
import { CountUp } from '@/components/ui/count-up';
import { TrendBadge } from '@/components/ui/trend-badge';
import { ScoreBar } from '@/components/ui/score-bar';
import { LiveIndicator } from '@/components/ui/live-indicator';
import { SparkLine } from '@/components/ui/spark-line';
import { discoveryAutocomplete, inferToolTraits, matchesDiscoveryQuery } from '@/lib/tool-discovery';

type TrendFilter = 'all' | 'hot' | 'rising' | 'stable' | 'declining';
type TimeFilter = 'week' | 'month' | 'quarter';

function statusOf(tool: AppTool): Exclude<TrendFilter, 'all'> {
  if (tool.signalType === 'breakthrough') return 'hot';
  if (tool.signalType === 'rising') return 'rising';
  if (tool.signalType === 'declining') return 'declining';
  return 'stable';
}

function domainFromWebsite(website?: string): string | null {
  if (!website) return null;
  try {
    const normalized = website.startsWith('http') ? website : `https://${website}`;
    return new URL(normalized).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function ToolLogo({ tool }: { tool: AppTool }) {
  const candidates = useMemo(() => {
    const urls: string[] = [];
    if (tool.icon && tool.icon.trim().length > 0) urls.push(tool.icon);
    const domain = domainFromWebsite(tool.website);
    if (domain) {
      urls.push(`https://unavatar.io/${domain}`);
      urls.push(`https://logo.clearbit.com/${domain}`);
      urls.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
      urls.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
    }
    return urls;
  }, [tool.icon, tool.website]);

  const [index, setIndex] = useState(0);
  const current = candidates[index];
  const initials = tool.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();

  return (
    <div className="h-12 w-12 rounded-xl border border-white/15 bg-white/5 p-1.5 overflow-hidden grid place-items-center">
      {current ? (
        <img
          src={current}
          alt={`${tool.name} logo`}
          className="h-full w-full object-contain"
          loading="lazy"
          onError={() => setIndex((prev) => (prev < candidates.length - 1 ? prev + 1 : prev))}
        />
      ) : (
        <span className="text-xs font-bold text-white/80">{initials}</span>
      )}
    </div>
  );
}

export function TrendsPremium({
  tools,
  lang = 'fr',
  lastSyncLabel,
}: {
  tools: AppTool[];
  lang?: Language;
  lastSyncLabel: string;
}) {
  const [trendFilter, setTrendFilter] = useState<TrendFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [pricingFilter, setPricingFilter] = useState<'all' | 'free' | 'freemium' | 'paid'>('all');
  const [apiFilter, setApiFilter] = useState<'all' | 'api' | 'no-api'>('all');
  const [buildFilter, setBuildFilter] = useState<'all' | 'open-source' | 'no-code' | 'self-hosted'>('all');
  const [popularityFilter, setPopularityFilter] = useState<'all' | 'mega' | 'high' | 'medium' | 'low'>('all');

  const categories = useMemo(() => Array.from(new Set(tools.map((t) => t.category))).sort(), [tools]);
  const suggestions = useMemo(() => discoveryAutocomplete(tools, query), [tools, query]);
  const filtered = useMemo(
    () =>
      tools
        .filter((t) => (trendFilter === 'all' ? true : statusOf(t) === trendFilter))
        .filter((t) => (categoryFilter === 'all' ? true : t.category === categoryFilter))
        .filter((t) => matchesDiscoveryQuery(t, query))
        .filter((t) => (pricingFilter === 'all' ? true : (t.pricing ?? '').toLowerCase() === pricingFilter))
        .filter((t) => {
          const traits = inferToolTraits(t);
          if (apiFilter === 'all') return true;
          return apiFilter === 'api' ? traits.hasApi : !traits.hasApi;
        })
        .filter((t) => {
          const traits = inferToolTraits(t);
          if (buildFilter === 'all') return true;
          if (buildFilter === 'open-source') return traits.openSource;
          if (buildFilter === 'no-code') return traits.noCode;
          return traits.selfHosted;
        })
        .filter((t) => {
          const traits = inferToolTraits(t);
          return popularityFilter === 'all' ? true : traits.popularity === popularityFilter;
        })
        .sort((a, b) => b.trendingScore - a.trendingScore),
    [tools, trendFilter, categoryFilter, query, pricingFilter, apiFilter, buildFilter, popularityFilter]
  );

  const grouped = useMemo(
    () => ({
      hot: filtered.filter((t) => statusOf(t) === 'hot'),
      rising: filtered.filter((t) => statusOf(t) === 'rising'),
      declining: filtered.filter((t) => statusOf(t) === 'declining'),
    }),
    [filtered]
  );

  const tracked = filtered.length;
  const hotCount = filtered.filter((t) => statusOf(t) === 'hot').length;
  const risingCount = filtered.filter((t) => statusOf(t) === 'rising').length;
  const decliningCount = filtered.filter((t) => statusOf(t) === 'declining').length;

  const row = (tool: AppTool, idx: number) => {
    const rank = idx + 1;
    const rankColor = rank === 1 ? '#ff9900' : rank === 2 ? '#cccccc' : rank === 3 ? '#cd7f32' : 'rgba(255,255,255,0.3)';
    const growth = Number(tool.weeklyGrowth ?? tool.metrics.monthlyGrowth ?? 0);
    const spark = Array.from({ length: 7 }, (_, i) => tool.trendingScore - 8 + i * 1.8 + Math.sin(i + idx) * 3);
    const status = statusOf(tool);
    return (
      <Link
        key={tool.id}
        href={`/tool/${tool.id}`}
        className={`grid grid-cols-[44px_56px_1.5fr_1fr_120px_120px_120px_90px] gap-3 items-center rounded-2xl border border-white/10 bg-[#0d0d1a] p-4 premium-card ${
          rank <= 3 ? 'premium-top-gradient' : ''
        }`}
        style={{ animation: `premiumCardIn 400ms ease-out ${idx * 80}ms both` }}
      >
        <div className="text-xl font-extrabold" style={{ color: rankColor }}>
          #{rank}
        </div>
        <ToolLogo tool={tool} />
        <div className="min-w-0">
          <p className="font-bold text-white">{tool.name}</p>
          <p className="text-xs text-white/45">{tool.category}</p>
        </div>
        <div className="space-y-1.5">
          <div className="text-[11px] text-white/35">Trend Score</div>
          <ScoreBar score={tool.trendingScore} animated delayMs={idx * 100} />
        </div>
        <div className={growth >= 0 ? 'text-[#00ff88]' : 'text-[#ff4466]'}>
          {growth >= 0 ? '↑' : '↓'} <CountUp value={Math.abs(growth)} decimals={2} />
          %
        </div>
        <TrendBadge status={status} />
        <div className="text-white/45 text-sm">
          <CountUp value={Number(tool.monthlyVisits ?? 0)} /> /{lang === 'fr' ? 'mois' : 'month'}
        </div>
        <SparkLine data={spark} color={status === 'hot' ? '#00ff88' : status === 'rising' ? '#00ccff' : '#ff4466'} />
      </Link>
    );
  };

  return (
    <div className="container mx-auto px-4 py-7 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="premium-hero-title text-[52px] font-extrabold leading-[1.04] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
            Tendances
          </h1>
          <p className="premium-subtitle text-white/50 text-base">{lang === 'fr' ? 'Les outils qui montent en ce moment' : 'Tools gaining momentum now'}</p>
          <p className="mt-2 text-[13px] text-white/40">
            {tracked} outils trackes <span className="text-white/20">•</span> {lastSyncLabel}
          </p>
        </div>
        <LiveIndicator />
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ['week', 'Cette semaine'],
          ['month', 'Ce mois'],
          ['quarter', '3 mois'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTimeFilter(value)}
            className={`px-3 h-9 rounded-full border text-sm ${timeFilter === value ? 'bg-[#ff4d0020] border-[#ff4d00] text-[#ff4d00]' : 'border-white/15 text-white/70 hover:bg-white/5'}`}
          >
            {label}
          </button>
        ))}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 h-9 rounded-full border border-white/15 bg-transparent text-sm text-white/80"
        >
          <option value="all">Toutes categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {(['all', 'hot', 'rising', 'stable', 'declining'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setTrendFilter(f)}
            className={`px-3 h-9 rounded-full border text-sm ${trendFilter === f ? 'bg-[#ff4d0020] border-[#ff4d00] text-[#ff4d00]' : 'border-white/15 text-white/70 hover:bg-white/5'}`}
          >
            {f === 'all' ? 'Tous' : f === 'hot' ? 'Hot 🔥' : f === 'rising' ? 'Rising 📈' : f === 'stable' ? 'Stable' : 'Declining'}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-white/10 bg-[#0d0d1a] p-3 space-y-3">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'fr' ? 'Recherche intelligente (outil, use case, tags...)' : 'Smart search (tool, use case, tags...)'}
            className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-white/90 placeholder:text-white/40"
          />
          {query.trim().length > 0 && suggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-white/10 bg-[#0b0f1d] p-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="w-full rounded-md px-2 py-1 text-left text-xs text-white/80 hover:bg-white/10"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select
            value={pricingFilter}
            onChange={(e) => setPricingFilter(e.target.value as 'all' | 'free' | 'freemium' | 'paid')}
            className="rounded-lg border border-white/15 bg-transparent px-3 py-2 text-xs text-white/80"
          >
            <option value="all">{lang === 'fr' ? 'Pricing: tous' : 'Pricing: all'}</option>
            <option value="free">Free</option>
            <option value="freemium">Freemium</option>
            <option value="paid">Paid</option>
          </select>
          <select
            value={apiFilter}
            onChange={(e) => setApiFilter(e.target.value as 'all' | 'api' | 'no-api')}
            className="rounded-lg border border-white/15 bg-transparent px-3 py-2 text-xs text-white/80"
          >
            <option value="all">{lang === 'fr' ? 'API: tous' : 'API: all'}</option>
            <option value="api">{lang === 'fr' ? 'API disponible' : 'Has API'}</option>
            <option value="no-api">{lang === 'fr' ? 'Sans API' : 'No API'}</option>
          </select>
          <select
            value={buildFilter}
            onChange={(e) => setBuildFilter(e.target.value as 'all' | 'open-source' | 'no-code' | 'self-hosted')}
            className="rounded-lg border border-white/15 bg-transparent px-3 py-2 text-xs text-white/80"
          >
            <option value="all">{lang === 'fr' ? 'Build: tous' : 'Build: all'}</option>
            <option value="open-source">Open-source</option>
            <option value="no-code">No-code</option>
            <option value="self-hosted">Self-hosted</option>
          </select>
          <select
            value={popularityFilter}
            onChange={(e) => setPopularityFilter(e.target.value as 'all' | 'mega' | 'high' | 'medium' | 'low')}
            className="rounded-lg border border-white/15 bg-transparent px-3 py-2 text-xs text-white/80"
          >
            <option value="all">{lang === 'fr' ? 'Popularité: toutes' : 'Popularity: all'}</option>
            <option value="mega">Mega</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl border border-[#00ff8820] bg-[#00ff8808] p-3 text-[#00ff88]">
          <CountUp value={hotCount} /> outils hot
        </div>
        <div className="rounded-xl border border-[#00ccff20] bg-[#00ccff08] p-3 text-[#00ccff]">
          <CountUp value={risingCount} /> en progression
        </div>
        <div className="rounded-xl border border-[#ff446620] bg-[#ff446608] p-3 text-[#ff4466]">
          <CountUp value={decliningCount} /> en declin
        </div>
      </div>

      <section className="space-y-3">
        <div className="rounded-xl border border-[#00ff8820] bg-[#00ff8808] px-4 py-2 font-semibold">🔥 En feu cette semaine</div>
        <div className="space-y-2">{grouped.hot.map((t, i) => row(t, i))}</div>
      </section>
      <section className="space-y-3">
        <div className="rounded-xl border border-[#00ccff20] bg-[#00ccff08] px-4 py-2 font-semibold">📈 En progression</div>
        <div className="space-y-2">{grouped.rising.map((t, i) => row(t, i + grouped.hot.length))}</div>
      </section>
      <section className="space-y-3">
        <div className="rounded-xl border border-[#ff446620] bg-[#ff446608] px-4 py-2 font-semibold">📉 En déclin</div>
        <div className="space-y-2">{grouped.declining.map((t, i) => row(t, i + grouped.hot.length + grouped.rising.length))}</div>
      </section>
    </div>
  );
}
