'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { AppTool } from '@/lib/get-tools';
import type { ToolAiAnalysis } from '@/lib/ai-analysis';

export function AiAnalysisCard({
  tool,
  initialAnalysis,
  lang = 'fr',
}: {
  tool: AppTool;
  initialAnalysis: ToolAiAnalysis;
  lang?: 'fr' | 'en';
}) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [loading, setLoading] = useState(false);
  const [freeUsed, setFreeUsed] = useState(false);
  const [isPro, setIsPro] = useState<boolean | null>(null);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const res = await fetch('/api/me');
        if (!res.ok) {
          setIsPro(false);
          return;
        }
        const payload = (await res.json()) as { user?: { plan?: string } };
        setIsPro(payload.user?.plan === 'pro');
      } catch {
        setIsPro(false);
      }
    };
    void loadPlan();
  }, []);

  const canRegenerate = isPro || (!freeUsed && isPro !== null);

  const regenerate = async () => {
    if (!canRegenerate || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tool-analysis', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tool, lang }),
      });
      if (res.ok) {
        const payload = (await res.json()) as { analysis?: ToolAiAnalysis };
        if (payload.analysis) {
          setAnalysis(payload.analysis);
          if (!isPro) setFreeUsed(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#12121e] p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="text-white font-bold">{lang === 'fr' ? 'IA Analysis' : 'AI Analysis'}</h3>
        </div>
        <button
          onClick={regenerate}
          disabled={!canRegenerate || loading}
          className="px-3 py-1.5 rounded-md border border-white/15 text-sm text-white disabled:opacity-50"
        >
          {loading ? '...' : lang === 'fr' ? "Regenerer l'analyse" : 'Regenerate analysis'}
        </button>
      </div>
      {!isPro && (
        <p className="text-xs text-muted-foreground">
          {lang === 'fr'
            ? 'Version free: 1 regeneration par session.'
            : 'Free plan: 1 regeneration per session.'}
        </p>
      )}
      <div className="space-y-3 text-sm">
        <p><span className="text-white font-semibold">1.</span> {analysis.whyNow}</p>
        <p><span className="text-white font-semibold">2.</span> {analysis.positioning}</p>
        <p><span className="text-white font-semibold">3.</span> {analysis.opportunities}</p>
        <p className="text-accent font-medium">{analysis.verdict}</p>
      </div>
    </div>
  );
}
