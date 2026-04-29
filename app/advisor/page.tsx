'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/navigation';
import { PremiumPageShell } from '@/components/ui/premium-page-shell';
import type { AppTool } from '@/lib/get-tools';
import { matchesDiscoveryQuery } from '@/lib/tool-discovery';

export default function AdvisorPage() {
  const [tools, setTools] = useState<AppTool[]>([]);
  const [prompt, setPrompt] = useState('');
  const [submitted, setSubmitted] = useState('');

  useEffect(() => {
    void fetch('/api/tools')
      .then((response) => response.json())
      .then((payload: { tools?: AppTool[] }) => setTools(payload.tools ?? []));
  }, []);

  const recommendations = useMemo(() => {
    const q = submitted.trim();
    if (!q) return [];
    return tools
      .filter((tool) => matchesDiscoveryQuery(tool, q))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 6);
  }, [tools, submitted]);

  return (
    <PremiumPageShell>
      <Navigation />
      <div className="container mx-auto px-4 py-7 space-y-6">
        <div>
          <h1 className="premium-hero-title text-[46px] font-extrabold leading-[1.05] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
            AI Advisor
          </h1>
          <p className="text-white/55 mt-2">Décris ton besoin et Peakly te recommande les meilleurs outils IA.</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0d0d1a] p-4 space-y-3">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={4}
            placeholder="Ex: Je cherche un outil IA pour automatiser le support client et créer une base de connaissance."
            className="w-full rounded-lg border border-white/15 bg-[#0a1224] px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
          <button
            onClick={() => setSubmitted(prompt)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          >
            Générer des recommandations
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {recommendations.map((tool) => (
            <Link key={tool.id} href={`/tool/${tool.id}`} className="rounded-xl border border-white/10 bg-[#0d0d1a] p-4 hover:border-accent">
              <p className="font-bold text-white">{tool.name}</p>
              <p className="text-xs text-white/45 mt-1">{tool.category}</p>
              <p className="text-sm text-white/70 mt-2 line-clamp-2">{tool.description}</p>
              <p className="text-xs text-accent mt-3">Score: {tool.trendingScore.toFixed(2)}</p>
            </Link>
          ))}
        </div>
      </div>
    </PremiumPageShell>
  );
}
