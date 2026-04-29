'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Tool } from '@/lib/data';
import type { Language } from '@/lib/i18n-types';
import type { DataHealth } from '@/lib/data-health';
import { discoveryAutocomplete, inferToolTraits, matchesDiscoveryQuery } from '@/lib/tool-discovery';

const TOOL_LOGO_DOMAINS: Record<string, string> = {
  chatgpt: 'openai.com',
  claude: 'anthropic.com',
  gemini: 'google.com',
  copilot: 'microsoft.com',
  midjourney: 'midjourney.com',
  'dall-e': 'openai.com',
  'stable-diffusion': 'stability.ai',
  perplexity: 'perplexity.ai',
  notionai: 'notion.so',
  cursor: 'cursor.com',
  v0: 'v0.dev',
  'eleven-labs': 'elevenlabs.io',
  dify: 'dify.ai',
  retool: 'retool.com',
  make: 'make.com',
  zapier: 'zapier.com',
  langchain: 'langchain.com',
  huggingface: 'huggingface.co',
  replicate: 'replicate.com',
  'vercel-ai': 'vercel.com',
  'anthropic-api': 'anthropic.com',
  groq: 'groq.com',
  'together-ai': 'together.ai',
  modal: 'modal.com',
  runwayml: 'runwayml.com',
  synthesia: 'synthesia.io',
  descript: 'descript.com',
  jasper: 'jasper.ai',
  'copy-ai': 'copy.ai',
  pictory: 'pictory.ai',
  'murf-ai': 'murf.ai',
  'article-ai': 'articleai.io',
  wordtune: 'wordtune.com',
  grammarly: 'grammarly.com',
  deepl: 'deepl.com',
  uberduck: 'uberduck.ai',
  openjourney: 'huggingface.co',
  animatediff: 'github.com',
  pika: 'pika.art',
  lumiere: 'google.com',
  suno: 'suno.com',
  udio: 'udio.com',
  musicfy: 'musicfy.lol',
  'elevenlabs-premium': 'elevenlabs.io',
  whisper: 'openai.com',
  cohere: 'cohere.com',
  'ai21-labs': 'ai21.com',
  llamaindex: 'llamaindex.ai',
  mem0: 'mem0.ai',
};

interface BubbleData {
  tool: Tool;
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  radius: number;
  phaseX: number;
  phaseY: number;
  hover: number;
  logoUrl?: string;
  logoCandidates: string[];
  logoTryIndex: number;
}

export function BubbleMap({
  lang = 'fr',
  tools,
  dataHealth,
}: {
  lang?: Language;
  tools: Tool[];
  dataHealth?: DataHealth | null;
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<BubbleData[]>([]);
  const animationRef = useRef<number | null>(null);
  const hoveredToolIdRef = useRef<string | null>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const logoCacheRef = useRef<Record<string, HTMLImageElement | null>>({});
  const [hoveredToolId, setHoveredToolId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [trendFilter, setTrendFilter] = useState<
    'all' | 'breakthrough' | 'hot' | 'rising' | 'stable' | 'declining'
  >('all');
  const [growthFilter, setGrowthFilter] = useState<
    'all' | 'hyper' | 'positive' | 'flat' | 'negative' | 'crash'
  >('all');
  const [topN, setTopN] = useState(20);
  const [sortBy, setSortBy] = useState<'trend' | 'growth' | 'adoption' | 'visits' | 'name'>('trend');
  const [sizeBy, setSizeBy] = useState<'trend' | 'growth' | 'adoption' | 'uniform'>('trend');
  const [enterpriseOnly, setEnterpriseOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [pricingFilter, setPricingFilter] = useState<'all' | 'free' | 'freemium' | 'paid'>('all');
  const [apiFilter, setApiFilter] = useState<'all' | 'api' | 'no-api'>('all');
  const suggestions = useMemo(() => discoveryAutocomplete(tools, query), [tools, query]);

  const categories = useMemo(
    () => Array.from(new Set(tools.map((tool) => tool.category))).sort(),
    [tools]
  );

  const filteredTools = useMemo(() => {
    return tools
      .filter((tool) =>
        enterpriseOnly
          ? !['Developer Tools', 'Internal Tools', 'ML API', 'API', 'LLM Ops'].includes(tool.category)
          : true
      )
      .filter((tool) => categoryFilter === 'all' || tool.category === categoryFilter)
      .filter((tool) => matchesDiscoveryQuery(tool, query))
      .filter((tool) => {
        if (trendFilter === 'all') return true;
        if (trendFilter === 'breakthrough') return tool.signalType === 'breakthrough';
        if (trendFilter === 'hot') return tool.trendingScore >= 80;
        const toolTrend = tool.signalType === 'breakthrough' ? 'rising' : tool.signalType;
        return toolTrend === trendFilter;
      })
      .filter((tool) => {
        if (growthFilter === 'all') return true;
        if (growthFilter === 'hyper') return tool.metrics.monthlyGrowth >= 30;
        if (growthFilter === 'positive') return tool.metrics.monthlyGrowth >= 5 && tool.metrics.monthlyGrowth < 30;
        if (growthFilter === 'flat') return tool.metrics.monthlyGrowth > -5 && tool.metrics.monthlyGrowth < 5;
        if (growthFilter === 'negative') return tool.metrics.monthlyGrowth <= -5 && tool.metrics.monthlyGrowth > -20;
        return tool.metrics.monthlyGrowth <= -20;
      })
      .filter((tool) => (pricingFilter === 'all' ? true : (tool.pricing ?? '').toLowerCase() === pricingFilter))
      .filter((tool) => {
        const traits = inferToolTraits(tool);
        if (apiFilter === 'all') return true;
        return apiFilter === 'api' ? traits.hasApi : !traits.hasApi;
      });
  }, [tools, enterpriseOnly, categoryFilter, query, trendFilter, growthFilter, pricingFilter, apiFilter]);

  const sortedTools = useMemo(() => {
    return [...filteredTools].sort((a, b) => {
      if (sortBy === 'growth') return b.metrics.monthlyGrowth - a.metrics.monthlyGrowth;
      if (sortBy === 'adoption') return b.metrics.adoptionRate - a.metrics.adoptionRate;
      if (sortBy === 'visits') return (b.monthlyVisits ?? 0) - (a.monthlyVisits ?? 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.trendingScore - a.trendingScore;
    });
  }, [filteredTools, sortBy]);

  const topTools = useMemo(() => sortedTools.slice(0, topN), [sortedTools, topN]);
  const hoveredTool = topTools.find((tool) => tool.id === hoveredToolId) ?? null;
  const activeTool = hoveredTool ?? topTools[0] ?? null;

  const metricValue = (tool: Tool, metric: 'trend' | 'growth' | 'adoption'): number => {
    if (metric === 'growth') return Math.max(0, Math.min(100, tool.metrics.monthlyGrowth + 50));
    if (metric === 'adoption') return tool.metrics.adoptionRate;
    return tool.trendingScore;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const getRadius = (tool: Tool): number => {
      if (sizeBy === 'uniform') return 78;
      const value = metricValue(tool, sizeBy);
      if (value >= 80) return 108;
      if (value >= 60) return 86;
      if (value >= 40) return 68;
      return 54;
    };

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);
    };

    const initializeBubbles = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      bubblesRef.current = topTools.map((tool) => ({
        tool,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        homeX: Math.random() * width,
        homeY: Math.random() * height,
        radius: getRadius(tool),
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        hover: 0,
        logoCandidates: resolveLogoUrls(tool),
        logoTryIndex: 0,
        logoUrl: undefined,
      }));
      for (const bubble of bubblesRef.current) prepareLogoForBubble(bubble);
    };

    const domainFromWebsite = (website?: string): string | null => {
      if (!website) return null;
      try {
        const normalized = website.startsWith('http') ? website : `https://${website}`;
        return new URL(normalized).hostname.replace(/^www\./, '');
      } catch {
        return null;
      }
    };

    const resolveLogoUrls = (tool: Tool): string[] => {
      const urls: string[] = [];
      if (tool.icon && tool.icon.trim().length > 0) urls.push(tool.icon);
      const mappedDomain = TOOL_LOGO_DOMAINS[tool.id];
      const domain = domainFromWebsite(tool.website) ?? mappedDomain;
      if (!domain) return urls;
      urls.push(`https://unavatar.io/${domain}`);
      urls.push(`https://logo.clearbit.com/${domain}`);
      urls.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
      urls.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
      return urls;
    };

    const loadLogo = (url?: string, onError?: () => void) => {
      if (!url || logoCacheRef.current[url] !== undefined) return;
      const img = new Image();
      img.onload = () => {
        logoCacheRef.current[url] = img;
      };
      img.onerror = () => {
        logoCacheRef.current[url] = null;
        if (onError) onError();
      };
      logoCacheRef.current[url] = null;
      img.src = url;
    };

    const prepareLogoForBubble = (bubble: BubbleData) => {
      if (!bubble.logoCandidates.length) return;
      const current = bubble.logoCandidates[bubble.logoTryIndex];
      bubble.logoUrl = current;
      const cached = logoCacheRef.current[current];
      if (cached instanceof HTMLImageElement || cached === null) return;
      loadLogo(current, () => {
        if (bubble.logoTryIndex < bubble.logoCandidates.length - 1) {
          bubble.logoTryIndex += 1;
          prepareLogoForBubble(bubble);
        }
      });
    };

    const visualStatus = (score: number): 'hot' | 'rising' | 'stable' | 'declining' => {
      if (score > 75) return 'hot';
      if (score > 50) return 'rising';
      if (score >= 30) return 'stable';
      return 'declining';
    };

    const getBubbleTheme = (tool: Tool) => {
      const status = visualStatus(tool.trendingScore);
      if (status === 'hot') {
        return {
          status,
          fill: '#0d1f17',
          border: '#00ff88',
          glow: 'rgba(0,255,136,0.2)',
          textGrowth: '#00ff88',
        };
      }
      if (status === 'rising') {
        return {
          status,
          fill: '#0d1720',
          border: '#00ccff',
          glow: 'rgba(0,204,255,0.2)',
          textGrowth: '#00ff88',
        };
      }
      if (status === 'declining') {
        return {
          status,
          fill: '#1f0d12',
          border: '#ff4466',
          glow: 'rgba(255,68,102,0.18)',
          textGrowth: '#ff4466',
        };
      }
      return {
        status,
        fill: '#12121e',
        border: 'rgba(255,255,255,0.14)',
        glow: 'rgba(255,255,255,0.08)',
        textGrowth: '#00ff88',
      };
    };

    const getMonthlyVisits = (tool: Tool): number | null => {
      const raw = (tool as Tool & { monthlyVisits?: unknown }).monthlyVisits;
      if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
      return null;
    };

    const draw = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#04060f');
      gradient.addColorStop(1, '#0b1022');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      let hoveredBubble: BubbleData | null = null;

      for (const bubble of bubblesRef.current) {
        const radius = bubble.radius * (1 + bubble.hover * 0.08);
        const isHovered = hoveredToolIdRef.current === bubble.tool.id;
        const theme = getBubbleTheme(bubble.tool);
        if (isHovered) hoveredBubble = bubble;
        const pulse =
          theme.status === 'hot' ? 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(performance.now() / 3000)) : 1;

        ctx.save();
        ctx.shadowBlur = isHovered ? 36 : 22;
        ctx.shadowColor = theme.glow;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = theme.fill;
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, radius * 1.04, 0, Math.PI * 2);
        ctx.strokeStyle = theme.status === 'hot' ? 'rgba(0,255,136,0.45)' : 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        if (isHovered) {
          ctx.beginPath();
          ctx.arc(bubble.x, bubble.y, radius * 1.01, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }

        ctx.strokeStyle =
          theme.status === 'hot'
            ? `rgba(0,255,136,${pulse})`
            : isHovered
              ? theme.border
              : theme.border;
        ctx.lineWidth = isHovered ? 2.2 : 1.4;
        ctx.stroke();

        const logoContainerRadius = radius * 0.66;
        const logoY = bubble.y - radius * 0.04;
        const logoImage = bubble.logoUrl ? logoCacheRef.current[bubble.logoUrl] : null;
        if (logoImage) {
          const sourceW = logoImage.naturalWidth || logoImage.width || 1;
          const sourceH = logoImage.naturalHeight || logoImage.height || 1;
          const containerSize = logoContainerRadius * 2;
          const maxRenderSize = containerSize * 0.92;
          const scale = Math.min(maxRenderSize / sourceW, maxRenderSize / sourceH);
          const renderW = sourceW * scale;
          const renderH = sourceH * scale;

          ctx.save();
          ctx.beginPath();
          ctx.arc(bubble.x, logoY, logoContainerRadius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(
            logoImage,
            bubble.x - renderW / 2,
            logoY - renderH / 2,
            renderW,
            renderH
          );
          ctx.restore();
        } else {
          const initials = bubble.tool.name
            .split(' ')
            .slice(0, 3)
            .map((part) => part[0])
            .join('')
            .toUpperCase();
          const fallbackText = initials.slice(0, 3);
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `700 ${Math.max(13, Math.min(30, radius * 0.24))}px Inter, sans-serif`;
          ctx.fillText(fallbackText, bubble.x, logoY);
        }

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `600 ${Math.max(11, Math.min(15, radius * 0.2))}px Inter, sans-serif`;
        const label = bubble.tool.name.length > 14 ? `${bubble.tool.name.slice(0, 12)}..` : bubble.tool.name;
        const labelY = bubble.y + radius * 0.3;
        ctx.fillText(label, bubble.x, labelY);

        const growth = bubble.tool.metrics.monthlyGrowth;
        ctx.fillStyle = growth >= 0 ? '#00ff88' : '#ff4466';
        ctx.font = `700 ${Math.max(10, Math.min(13, radius * 0.18))}px Inter, sans-serif`;
        const growthY = bubble.y + radius * 0.5;
        ctx.fillText(`${growth >= 0 ? '+' : ''}${growth}%`, bubble.x, growthY);
      }

      if (hoveredBubble && mouseRef.current) {
        const tool = hoveredBubble.tool;
        const visits = getMonthlyVisits(tool);
        const growth = tool.metrics.monthlyGrowth;
        const lines = [
          tool.name,
          `Score: ${tool.trendingScore}/100`,
          `Croissance: ${growth >= 0 ? '+' : ''}${growth}%`,
          `Categorie: ${tool.category}`,
          `Visiteurs/mois: ${visits ? visits.toLocaleString() : 'n/a'}`,
        ];
        ctx.save();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const x = Math.min(mouseRef.current.x + 14, width - 230);
        const y = Math.min(mouseRef.current.y + 14, height - 130);
        const boxW = 220;
        const boxH = 110;
        ctx.fillStyle = '#1a1a2e';
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, boxW, boxH, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 13px Inter, sans-serif';
        ctx.fillText(lines[0], x + 12, y + 10);
        ctx.font = '500 12px Inter, sans-serif';
        ctx.fillText(lines[1], x + 12, y + 32);
        ctx.fillStyle = growth >= 0 ? '#00ff88' : '#ff4466';
        ctx.fillText(lines[2], x + 12, y + 50);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(lines[3], x + 12, y + 68);
        ctx.fillText(lines[4], x + 12, y + 86);
        ctx.restore();
      }
    };

    const getToolAt = (e: MouseEvent): Tool | null => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let bestTool: Tool | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const bubble of bubblesRef.current) {
        const r = bubble.radius * (1 + bubble.hover * 0.08);
        const dx = x - bubble.x;
        const dy = y - bubble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < r && distance < bestDistance) {
          bestTool = bubble.tool;
          bestDistance = distance;
        }
      }
      return bestTool;
    };

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const hit = getToolAt(e);
      const nextId = hit?.id ?? null;
      hoveredToolIdRef.current = nextId;
      setHoveredToolId((prev) => (prev === nextId ? prev : nextId));
      canvas.style.cursor = hit ? 'pointer' : 'default';
    };

    const handleLeave = () => {
      hoveredToolIdRef.current = null;
      mouseRef.current = null;
      setHoveredToolId(null);
      canvas.style.cursor = 'default';
    };

    const handleClick = (e: MouseEvent) => {
      const hit = getToolAt(e);
      if (hit) router.push(`/tool/${hit.id}`);
    };

    const stepPhysics = (time: number) => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const bubbles = bubblesRef.current;

      for (const bubble of bubbles) {
        const isHovered = hoveredToolIdRef.current === bubble.tool.id;
        bubble.hover += ((isHovered ? 1 : 0) - bubble.hover) * 0.2;

        // Slow local drift with spring back to home zone.
        const driftX = Math.sin(time * 0.00022 + bubble.phaseX) * 0.004;
        const driftY = Math.cos(time * 0.0002 + bubble.phaseY) * 0.004;
        const homeForceX = (bubble.homeX - bubble.x) * 0.00035;
        const homeForceY = (bubble.homeY - bubble.y) * 0.00035;

        bubble.vx += driftX + homeForceX;
        bubble.vy += driftY + homeForceY;
        bubble.vx *= 0.97;
        bubble.vy *= 0.97;
        bubble.vx = Math.max(-0.2, Math.min(0.2, bubble.vx));
        bubble.vy = Math.max(-0.2, Math.min(0.2, bubble.vy));

        bubble.x += bubble.vx;
        bubble.y += bubble.vy;
      }

      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < bubbles.length; i++) {
          for (let j = i + 1; j < bubbles.length; j++) {
            const a = bubbles[i];
            const b = bubbles[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
            const aRadius = a.radius * (1 + a.hover * 0.08);
            const bRadius = b.radius * (1 + b.hover * 0.08);
            const minDist = aRadius + bRadius + 3;
            if (dist < minDist) {
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = minDist - dist;
              a.x -= nx * overlap * 0.5;
              a.y -= ny * overlap * 0.5;
              b.x += nx * overlap * 0.5;
              b.y += ny * overlap * 0.5;

              const rvx = b.vx - a.vx;
              const rvy = b.vy - a.vy;
              const sepVel = rvx * nx + rvy * ny;
              if (sepVel < 0) {
                const impulse = -sepVel * 0.35;
                a.vx -= nx * impulse;
                a.vy -= ny * impulse;
                b.vx += nx * impulse;
                b.vy += ny * impulse;
              }
            }
          }
        }
      }

      for (const bubble of bubbles) {
        const r = bubble.radius * (1 + bubble.hover * 0.08);
        if (bubble.x < r) {
          bubble.x = r;
          bubble.vx *= -0.3;
        } else if (bubble.x > width - r) {
          bubble.x = width - r;
          bubble.vx *= -0.3;
        }
        if (bubble.y < r) {
          bubble.y = r;
          bubble.vy *= -0.3;
        } else if (bubble.y > height - r) {
          bubble.y = height - r;
          bubble.vy *= -0.3;
        }
      }
    };

    const animate = (time: number) => {
      stepPhysics(time);
      draw();
      animationRef.current = window.requestAnimationFrame(animate);
    };

    resizeCanvas();
    initializeBubbles();
    animationRef.current = window.requestAnimationFrame(animate);

    const handleResize = () => {
      resizeCanvas();
      initializeBubbles();
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseleave', handleLeave);
    canvas.addEventListener('click', handleClick);

    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseleave', handleLeave);
      canvas.removeEventListener('click', handleClick);
      canvas.style.cursor = 'default';
    };
  }, [topTools, sizeBy, router]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-3 flex items-center justify-between text-xs text-slate-300">
        <span>{lang === 'fr' ? 'Top SaaS/IA (carte interactive)' : 'Top SaaS/AI (interactive map)'}</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {lang === 'fr' ? 'Croissance +' : 'Growth +'}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {lang === 'fr' ? 'Croissance -' : 'Growth -'}
          </span>
        </div>
      </div>
      <div className="mb-2 text-xs text-slate-400">
        {lang === 'fr' ? 'Derniere synchro' : 'Last sync'}:{' '}
        <span className="text-foreground font-medium">
          {dataHealth?.lastSyncAt ? new Date(dataHealth.lastSyncAt).toLocaleString() : 'n/a'}
        </span>
        {' • '}
        {lang === 'fr' ? 'Qualite' : 'Quality'}:{' '}
        <span className="text-foreground font-medium">{dataHealth?.quality ?? 'unknown'}</span>
      </div>

      <div className="mb-3 rounded-2xl border border-white/10 bg-[#0d0d1a] p-3">
        <div className="mb-3 relative">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={lang === 'fr' ? 'Recherche semantique (outil, usage, tags...)' : 'Semantic search (tool, use case, tags...)'}
            className="w-full rounded-xl border border-white/15 bg-[#0a1224] px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#00ff88] focus:outline-none"
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4">
          <label className="space-y-1.5 text-xs">
            <span className="text-white/70">{lang === 'fr' ? 'Categorie' : 'Category'}</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#0a1224] px-3 py-2 text-sm text-white focus:border-[#00ff88] focus:outline-none"
            >
              <option value="all">{lang === 'fr' ? 'Toutes categories' : 'All categories'}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-xs">
            <span className="text-white/70">{lang === 'fr' ? 'Tendance' : 'Trend'}</span>
            <select
              value={trendFilter}
              onChange={(event) =>
                setTrendFilter(event.target.value as 'all' | 'breakthrough' | 'hot' | 'rising' | 'stable' | 'declining')
              }
              className="w-full rounded-xl border border-white/15 bg-[#0a1224] px-3 py-2 text-sm text-white focus:border-[#00ff88] focus:outline-none"
            >
              <option value="all">{lang === 'fr' ? 'Toutes tendances' : 'All trends'}</option>
              <option value="breakthrough">{lang === 'fr' ? 'Breakthrough' : 'Breakthrough'}</option>
              <option value="hot">{lang === 'fr' ? 'Score chaud (>=80)' : 'Hot score (>=80)'}</option>
              <option value="rising">Rising</option>
              <option value="stable">Stable</option>
              <option value="declining">Declining</option>
            </select>
          </label>

          <label className="space-y-1.5 text-xs">
            <span className="text-white/70">{lang === 'fr' ? 'Croissance mensuelle' : 'Monthly growth'}</span>
            <select
              value={growthFilter}
              onChange={(event) =>
                setGrowthFilter(event.target.value as 'all' | 'hyper' | 'positive' | 'flat' | 'negative' | 'crash')
              }
              className="w-full rounded-xl border border-white/15 bg-[#0a1224] px-3 py-2 text-sm text-white focus:border-[#00ff88] focus:outline-none"
            >
              <option value="all">{lang === 'fr' ? 'Toutes croissances' : 'All growth bands'}</option>
              <option value="hyper">{lang === 'fr' ? 'Hyper croissance (>= +30%)' : 'Hyper growth (>= +30%)'}</option>
              <option value="positive">{lang === 'fr' ? 'Croissance (+5% a +29%)' : 'Growth (+5% to +29%)'}</option>
              <option value="flat">{lang === 'fr' ? 'Stable (-4% a +4%)' : 'Flat (-4% to +4%)'}</option>
              <option value="negative">{lang === 'fr' ? 'Baisse legere (-5% a -19%)' : 'Mild decline (-5% to -19%)'}</option>
              <option value="crash">{lang === 'fr' ? 'Forte baisse (<= -20%)' : 'Strong decline (<= -20%)'}</option>
            </select>
          </label>
          <label className="space-y-1.5 text-xs">
            <span className="text-white/70">{lang === 'fr' ? 'Pricing' : 'Pricing'}</span>
            <select
              value={pricingFilter}
              onChange={(event) => setPricingFilter(event.target.value as 'all' | 'free' | 'freemium' | 'paid')}
              className="w-full rounded-xl border border-white/15 bg-[#0a1224] px-3 py-2 text-sm text-white focus:border-[#00ff88] focus:outline-none"
            >
              <option value="all">{lang === 'fr' ? 'Tous les plans' : 'All pricing'}</option>
              <option value="free">Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid">Paid</option>
            </select>
          </label>
          <label className="space-y-1.5 text-xs">
            <span className="text-white/70">API</span>
            <select
              value={apiFilter}
              onChange={(event) => setApiFilter(event.target.value as 'all' | 'api' | 'no-api')}
              className="w-full rounded-xl border border-white/15 bg-[#0a1224] px-3 py-2 text-sm text-white focus:border-[#00ff88] focus:outline-none"
            >
              <option value="all">{lang === 'fr' ? 'Toutes' : 'All'}</option>
              <option value="api">{lang === 'fr' ? 'API disponible' : 'Has API'}</option>
              <option value="no-api">{lang === 'fr' ? 'Sans API' : 'No API'}</option>
            </select>
          </label>

          <label className="space-y-1.5 text-xs">
            <span className="text-white/70">{lang === 'fr' ? 'Trier par' : 'Sort by'}</span>
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as 'trend' | 'growth' | 'adoption' | 'visits' | 'name')
              }
              className="w-full rounded-xl border border-white/15 bg-[#0a1224] px-3 py-2 text-sm text-white focus:border-[#00ff88] focus:outline-none"
            >
              <option value="trend">{lang === 'fr' ? 'Score tendance' : 'Trend score'}</option>
              <option value="growth">{lang === 'fr' ? 'Croissance' : 'Growth'}</option>
              <option value="adoption">{lang === 'fr' ? 'Adoption' : 'Adoption'}</option>
              <option value="visits">{lang === 'fr' ? 'Visiteurs/mois' : 'Monthly visitors'}</option>
              <option value="name">{lang === 'fr' ? 'Nom (A-Z)' : 'Name (A-Z)'}</option>
            </select>
          </label>

          <label className="space-y-1.5 text-xs">
            <span className="text-white/70">{lang === 'fr' ? 'Taille des bulles' : 'Bubble size'}</span>
            <select
              value={sizeBy}
              onChange={(event) => setSizeBy(event.target.value as 'trend' | 'growth' | 'adoption' | 'uniform')}
              className="w-full rounded-xl border border-white/15 bg-[#0a1224] px-3 py-2 text-sm text-white focus:border-[#00ff88] focus:outline-none"
            >
              <option value="trend">{lang === 'fr' ? 'Par tendance' : 'By trend'}</option>
              <option value="growth">{lang === 'fr' ? 'Par croissance' : 'By growth'}</option>
              <option value="adoption">{lang === 'fr' ? 'Par adoption' : 'By adoption'}</option>
              <option value="uniform">{lang === 'fr' ? 'Uniforme' : 'Uniform'}</option>
            </select>
          </label>

          <label className="space-y-1.5 text-xs">
            <span className="text-white/70">{lang === 'fr' ? 'Nombre de bulles' : 'Bubble count'}</span>
            <select
              value={String(topN)}
              onChange={(event) => setTopN(Number(event.target.value))}
              className="w-full rounded-xl border border-white/15 bg-[#0a1224] px-3 py-2 text-sm text-white focus:border-[#00ff88] focus:outline-none"
            >
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="30">Top 30</option>
              <option value="50">Top 50</option>
              <option value="75">Top 75</option>
            </select>
          </label>

          <label className="inline-flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-[#0a1224] px-3 py-2 text-xs text-white/80">
            <span>{lang === 'fr' ? 'Mode entreprises' : 'Enterprise mode'}</span>
            <input
              type="checkbox"
              checked={enterpriseOnly}
              onChange={(event) => setEnterpriseOnly(event.target.checked)}
              className="h-4 w-4 accent-[#00ff88]"
            />
          </label>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full flex-1 rounded-xl border border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.12)]"
      />

      {activeTool && (
        <div className="mt-4 p-4 bg-card rounded-lg border border-border">
          <h3 className="text-xl font-bold text-accent">{activeTool.name}</h3>
          <p className="text-muted-foreground">{activeTool.category}</p>
          <p className="text-foreground mt-2">{activeTool.description}</p>
          <p className="text-sm mt-3 text-muted-foreground">
            {lang === 'fr' ? 'Survol: details • Clic: page outil' : 'Hover: details • Click: tool page'}
          </p>
        </div>
      )}
    </div>
  );
}
