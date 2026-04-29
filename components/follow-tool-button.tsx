'use client';

import { useState } from 'react';

export function FollowToolButton({ toolId, lang = 'fr' }: { toolId: string; lang?: 'fr' | 'en' }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onFollow = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ toolId, thresholdPercent: 15 }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(payload.error ?? (lang === 'fr' ? 'Action impossible' : 'Action failed'));
        return;
      }
      setMessage(lang === 'fr' ? 'Outil suivi avec succes' : 'Tool followed successfully');
    } catch {
      setMessage(lang === 'fr' ? 'Erreur reseau' : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onFollow}
        disabled={loading}
        className="px-4 py-2 rounded-lg border border-white/15 bg-[#12121e] text-white hover:border-accent transition-colors disabled:opacity-60"
      >
        {loading
          ? lang === 'fr'
            ? 'En cours...'
            : 'Loading...'
          : lang === 'fr'
            ? 'Suivre cet outil'
            : 'Follow this tool'}
      </button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
