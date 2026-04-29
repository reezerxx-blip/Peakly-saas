'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Search } from 'lucide-react';
import Link from 'next/link';
import type { AppTool } from '@/lib/get-tools';
import type { Language } from '@/lib/i18n-types';
import { discoveryAutocomplete, inferToolTraits, matchesDiscoveryQuery } from '@/lib/tool-discovery';

type TrendFilter = 'all' | 'hot' | 'rising' | 'stable' | 'declining';

function signalToTrend(signal: AppTool['signalType']): Exclude<TrendFilter, 'all'> {
  if (signal === 'breakthrough') return 'hot';
  if (signal === 'rising') return 'rising';
  if (signal === 'declining') return 'declining';
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

function CountUp({
  value,
  durationMs = 1000,
  decimals = 0,
}: {
  value: number;
  durationMs?: number;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  const target = Number.isFinite(value) ? value : 0;

  useEffect(() => {
    let rafId = 0;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(target * eased);
      if (progress < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, durationMs]);

  return <>{display.toFixed(decimals)}</>;
}

function ToolLogo({ toolName, website }: { toolName: string; website?: string }) {
  const domain = domainFromWebsite(website);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);

  const candidates = useMemo(() => {
    if (!domain) return [];
    return [`https://logo.clearbit.com/${domain}`, `https://www.google.com/s2/favicons?domain=${domain}&sz=128`];
  }, [domain]);

  useEffect(() => {
    setLoaded(false);
    setIndex(0);
  }, [toolName, website]);

  return (
    <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-white/90 border border-white/15 shrink-0">
      {!loaded && <div className="absolute inset-0 premium-shimmer" />}
      {candidates[index] ? (
        <Image
          src={candidates[index]}
          alt={toolName}
          width={36}
          height={36}
          unoptimized
          className={`w-full h-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'}`}
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (index < candidates.length - 1) {
              setIndex((x) => x + 1);
              return;
            }
            setLoaded(true);
          }}
        />
      ) : (
        <div className="w-full h-full grid place-items-center text-[10px] font-bold text-[#111]">
          {toolName.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles = Array.from({ length: 40 }, () => ({
      x: 0,
      y: 0,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 1 + Math.random() * 2,
    }));

    let width = window.innerWidth;
    let height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    const linkMaxDistSq = 120 * 120;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      for (const p of particles) {
        if (p.x === 0 && p.y === 0) {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          continue;
        }
        p.x = Math.min(Math.max(p.x, 0), width);
        p.y = Math.min(Math.max(p.y, 0), height);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let lastFrame = 0;
    const draw = (now: number) => {
      // 30 FPS cap keeps animation smooth while reducing CPU usage.
      if (now - lastFrame < 33) {
        raf = requestAnimationFrame(draw);
        return;
      }
      lastFrame = now;
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < linkMaxDistSq) {
            ctx.strokeStyle = 'rgba(255,255,255,0.03)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}

export function CategoriesPremium({
  tools,
  lang = 'fr',
}: {
  tools: AppTool[];
  lang?: Language;
}) {
  const [query, setQuery] = useState('');
  const [trendFilter, setTrendFilter] = useState<TrendFilter>('all');
  const [pricingFilter, setPricingFilter] = useState<'all' | 'free' | 'freemium' | 'paid'>('all');
  const [apiFilter, setApiFilter] = useState<'all' | 'api' | 'no-api'>('all');
  const suggestions = useMemo(() => discoveryAutocomplete(tools, query), [tools, query]);

  const filteredTools = useMemo(() => {
    return tools
      .filter((tool) => (trendFilter === 'all' ? true : signalToTrend(tool.signalType) === trendFilter))
      .filter((tool) => matchesDiscoveryQuery(tool, query))
      .filter((tool) => (pricingFilter === 'all' ? true : (tool.pricing ?? '').toLowerCase() === pricingFilter))
      .filter((tool) => {
        const traits = inferToolTraits(tool);
        if (apiFilter === 'all') return true;
        return apiFilter === 'api' ? traits.hasApi : !traits.hasApi;
      });
  }, [tools, query, trendFilter, pricingFilter, apiFilter]);

  const categories = useMemo(() => {
    const grouped = new Map<string, AppTool[]>();
    for (const tool of filteredTools) {
      const list = grouped.get(tool.category);
      if (list) {
        list.push(tool);
      } else {
        grouped.set(tool.category, [tool]);
      }
    }

    return Array.from(grouped.entries())
      .map(([category, categoryTools]) => ({
        category,
        tools: categoryTools.sort((a, b) => b.trendingScore - a.trendingScore),
      }))
      .sort((a, b) => {
      const avgA = a.tools.reduce((sum, t) => sum + t.trendingScore, 0) / a.tools.length;
      const avgB = b.tools.reduce((sum, t) => sum + t.trendingScore, 0) / b.tools.length;
      return avgB - avgA;
    });
  }, [filteredTools]);

  const trackedCount = filteredTools.length;
  const trendingCount = filteredTools.filter((t) => t.trending).length;
  const maxUpdated = tools.map((t) => t.lastUpdatedAt).filter(Boolean).sort().reverse()[0];
  const hoursAgo = maxUpdated
    ? Math.max(1, Math.round((Date.now() - new Date(maxUpdated).getTime()) / (1000 * 60 * 60)))
    : null;

  let cardIndex = 0;

  return (
    <div className="relative min-h-screen bg-[#080810] text-white overflow-x-hidden">
      <ParticlesBackground />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 z-0 bg-[radial-gradient(circle_at_top_center,rgba(255,77,0,0.08),transparent_60%)]" />

      <div className="relative z-10 container mx-auto px-4 py-8 space-y-10">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-4">
            <h1 className="premium-hero-title text-[52px] leading-[1.05] font-extrabold bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
              {lang === 'fr' ? "Categories d'outils" : 'Tool Categories'}
            </h1>
            <p className="premium-subtitle text-white/50 text-base max-w-3xl">
              {lang === 'fr'
                ? "Explore le marche SaaS/IA par categories, signaux et momentum en temps reel."
                : 'Explore SaaS/AI market categories with live momentum signals.'}
            </p>
            <p className="text-[13px] text-white/40 flex items-center gap-2 flex-wrap">
              <span>{trackedCount} {lang === 'fr' ? 'outils trackes' : 'tracked tools'}</span>
              <span className="text-white/20">•</span>
              <span>{trendingCount} {lang === 'fr' ? 'en tendance' : 'trending'}</span>
              <span className="text-white/20">•</span>
              <span>
                {lang === 'fr'
                  ? `Mis a jour il y a ${hoursAgo ?? 'n/a'}h`
                  : `Updated ${hoursAgo ?? 'n/a'}h ago`}
              </span>
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-400/30 bg-red-500/10 text-red-300 text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500 premium-live-pulse" />
            Live
          </div>
        </div>

        <div className="space-y-4">
          <div className="mx-auto max-w-[480px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 premium-search-pulse" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === 'fr' ? 'Rechercher un outil...' : 'Search a tool...'}
              className="w-full h-12 pl-11 pr-4 rounded-[50px] bg-white/5 border border-white/15 placeholder:text-white/35 text-white outline-none focus:border-[#ff4d0060] focus:shadow-[0_0_20px_rgba(255,77,0,0.2)]"
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
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {([
              ['all', lang === 'fr' ? 'Tous' : 'All'],
              ['hot', 'Hot 🔥'],
              ['rising', 'Rising 📈'],
              ['stable', 'Stable'],
              ['declining', 'Declining'],
            ] as const).map(([value, label]) => {
              const active = trendFilter === value;
              return (
                <button
                  key={value}
                  onClick={() => setTrendFilter(value)}
                  className={`px-4 h-9 rounded-full border text-sm transition-all duration-150 ${
                    active
                      ? 'bg-[#ff4d0020] border-[#ff4d00] text-[#ff4d00]'
                      : 'bg-transparent border-white/15 text-white/70 hover:bg-white/5'
                  }`}
                >
                  {label}
                </button>
              );
            })}
            <select
              value={pricingFilter}
              onChange={(e) => setPricingFilter(e.target.value as 'all' | 'free' | 'freemium' | 'paid')}
              className="px-3 h-9 rounded-full border border-white/15 bg-transparent text-sm text-white/80"
            >
              <option value="all">{lang === 'fr' ? 'Pricing: tous' : 'Pricing: all'}</option>
              <option value="free">Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid">Paid</option>
            </select>
            <select
              value={apiFilter}
              onChange={(e) => setApiFilter(e.target.value as 'all' | 'api' | 'no-api')}
              className="px-3 h-9 rounded-full border border-white/15 bg-transparent text-sm text-white/80"
            >
              <option value="all">{lang === 'fr' ? 'API: tous' : 'API: all'}</option>
              <option value="api">{lang === 'fr' ? 'API disponible' : 'Has API'}</option>
              <option value="no-api">{lang === 'fr' ? 'Sans API' : 'No API'}</option>
            </select>
          </div>
        </div>

        <div className="space-y-12">
          {categories.map((cat) => {
            const avgTrending = cat.tools.reduce((sum, t) => sum + t.trendingScore, 0) / cat.tools.length;
            const trendingTools = cat.tools.filter((t) => t.trending).length;
            const avgColor = avgTrending > 60 ? '#00ff88' : avgTrending >= 40 ? '#ffaa00' : '#ff4466';

            return (
              <section key={cat.category} className="space-y-5">
                <div className="h-px w-full bg-gradient-to-r from-[#ff4d00] to-transparent" />
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-[22px] font-bold">{cat.category}</h2>
                      <span className="px-3 py-1 rounded-[20px] bg-white/5 border border-white/15 text-white/60 text-xs">
                        {cat.tools.length} {lang === 'fr' ? 'outils' : 'tools'}
                      </span>
                      {trendingTools > 0 ? (
                        <span className="px-3 py-1 rounded-[20px] bg-[#00ff8815] border border-[#00ff8840] text-[#00ff88] text-xs inline-flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] premium-dot-pulse" />
                          {trendingTools} {lang === 'fr' ? 'en tendance' : 'trending'}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-[20px] bg-white/5 border border-white/10 text-white/25 text-xs">
                          {lang === 'fr' ? '0 en tendance' : '0 trending'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="md:text-right">
                    <p className="text-[11px] uppercase tracking-wide text-white/30">{lang === 'fr' ? 'moy.' : 'avg.'}</p>
                    <p className="text-[36px] leading-none font-bold" style={{ color: avgColor }}>
                      <CountUp value={avgTrending} durationMs={1000} />
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {cat.tools.map((tool) => {
                    const trend = signalToTrend(tool.signalType);
                    const score = Number(tool.trendingScore) || 0;
                    const growth = Number(tool.weeklyGrowth ?? tool.metrics.monthlyGrowth ?? 0);
                    const visitors = Number(tool.monthlyVisits ?? 0);
                    const scoreColor = score > 60 ? '#00ff88' : score >= 40 ? '#ffaa00' : '#ff4466';
                    const pricing = (tool.pricing || 'free').toLowerCase();
                    const pricingClass =
                      pricing === 'free'
                        ? 'bg-[#00ff8820] text-[#00ff88]'
                        : pricing === 'freemium'
                          ? 'bg-[#ffaa0020] text-[#ffaa00]'
                          : 'bg-[#ff446620] text-[#ff4466]';
                    const delayMs = cardIndex * 80;
                    const scoreDelay = cardIndex * 100;
                    const thisCardIndex = cardIndex++;

                    return (
                      <Link
                        key={tool.id}
                        href={`/tool/${tool.id}`}
                        className={`group premium-card rounded-2xl border border-white/10 bg-[#0d0d1a] p-5 block ${
                          trend === 'hot'
                            ? 'hover:shadow-[0_0_30px_rgba(0,255,136,0.08)]'
                            : trend === 'rising'
                              ? 'hover:shadow-[0_0_30px_rgba(0,204,255,0.08)]'
                              : 'hover:shadow-[0_12px_40px_rgba(0,0,0,0.38)]'
                        }`}
                        style={{
                          animation: `premiumCardIn 400ms ease-out ${delayMs}ms both`,
                        }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <ToolLogo toolName={tool.name} website={tool.website} />
                            <div className="min-w-0">
                              <p className="text-white font-bold text-base truncate">{tool.name}</p>
                            </div>
                          </div>
                          <div
                            className={`px-2.5 py-1 rounded-full text-xs border inline-flex items-center gap-1.5 ${
                              trend === 'hot'
                                ? 'bg-[#00ff8815] border-[#00ff8840] text-[#00ff88]'
                                : trend === 'rising'
                                  ? 'bg-[#00ccff15] border-[#00ccff40] text-[#00ccff]'
                                  : trend === 'declining'
                                    ? 'bg-[#ff446615] border-[#ff446640] text-[#ff4466]'
                                    : 'bg-white/5 border-white/20 text-white/50'
                            }`}
                          >
                            {trend === 'hot' && <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] premium-dot-pulse" />}
                            {trend === 'rising' && <span className="premium-arrow-up">↑</span>}
                            {trend === 'declining' && <span>↓</span>}
                            <span>{trend}</span>
                          </div>
                        </div>

                        <p className="text-white/45 text-xs leading-relaxed line-clamp-2 mb-4">{tool.description}</p>

                        <div className="mb-4">
                          <div className="flex items-center justify-between text-[11px] text-white/30 mb-1.5">
                            <span>Trend Score</span>
                            <span className="text-white font-bold text-sm">
                              <CountUp value={score} durationMs={900 + thisCardIndex * 20} decimals={2} />
                            </span>
                          </div>
                          <div className="h-[3px] rounded bg-white/5 overflow-hidden relative">
                            <div
                              className="h-full rounded transition-all duration-1000 ease-out relative"
                              style={{
                                width: `${score}%`,
                                backgroundColor: scoreColor,
                                transitionDelay: `${scoreDelay}ms`,
                              }}
                            >
                              <span
                                className="absolute top-0 left-0 h-full w-1/3 premium-score-shine"
                                style={{ animationDelay: `${thisCardIndex * 120}ms` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[13px] font-semibold">
                            <span className={growth >= 0 ? 'text-[#00ff88]' : 'text-[#ff4466]'}>
                              {growth >= 0 ? '↑' : '↓'} <CountUp value={Math.abs(growth)} durationMs={800} decimals={2} />%
                            </span>
                          </div>
                          <p className="text-white/40 text-xs">
                            <CountUp value={visitors} durationMs={1000} /> /{lang === 'fr' ? 'mois' : 'month'}
                          </p>
                          <span className={`px-2 py-1 rounded-full text-[11px] ${pricingClass}`}>{pricing}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
