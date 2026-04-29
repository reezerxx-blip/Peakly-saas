'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

type TrendPoint = { label: string; value: number };
type MentionsPoint = { label: string; hn: number; reddit: number };
type StarsPoint = { label: string; stars: number; delta: number };
type ScorePoint = { label: string; score: number };

export function ToolInsightsCharts({
  lang = 'fr',
  status = 'stable',
  trendsData,
  mentionsData,
  starsData,
  scoreHistory,
}: {
  lang?: 'fr' | 'en';
  status?: 'hot' | 'rising' | 'stable' | 'declining';
  trendsData: TrendPoint[];
  mentionsData: MentionsPoint[];
  starsData: StarsPoint[];
  scoreHistory: ScorePoint[];
}) {
  const [windowPreset, setWindowPreset] = useState<'30d' | '90d' | '12m'>('12m');
  const statusColor =
    status === 'hot'
      ? '#f97316'
      : status === 'rising'
        ? '#22c55e'
        : status === 'declining'
          ? '#ef4444'
          : '#60a5fa';

  const slicedTrends = useMemo(() => {
    if (windowPreset === '30d') return trendsData.slice(-4);
    if (windowPreset === '90d') return trendsData.slice(-8);
    return trendsData;
  }, [trendsData, windowPreset]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-[#12121e] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white">
              {lang === 'fr' ? 'Google Trends (12 mois)' : 'Google Trends (12 months)'}
            </h3>
            <div className="flex items-center gap-1 text-xs">
              {(['30d', '90d', '12m'] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setWindowPreset(item)}
                  className={`px-2 py-1 rounded ${windowPreset === item ? 'bg-accent text-accent-foreground' : 'bg-background text-muted-foreground'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={slicedTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  formatter={(value: number) => Number(value).toFixed(2)}
                  contentStyle={{ backgroundColor: '#12121e', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Line type="monotone" dataKey="value" stroke={statusColor} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#12121e] p-4">
          <h3 className="font-bold text-white mb-3">
            {lang === 'fr' ? 'Mentions (HN + Reddit)' : 'Mentions (HN + Reddit)'}
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mentionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#12121e', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Bar dataKey="hn" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reddit" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#12121e] p-4">
          <h3 className="font-bold text-white mb-3">
            {lang === 'fr' ? 'Croissance GitHub Stars' : 'GitHub Stars Growth'}
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={starsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#12121e', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Line type="monotone" dataKey="stars" stroke="#a78bfa" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="delta" stroke="#22c55e" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#12121e] p-4">
        <h3 className="font-bold text-white mb-3">
          {lang === 'fr' ? 'Historique du score (30 jours)' : 'Score history (30 days)'}
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scoreHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                formatter={(value: number) => Number(value).toFixed(2)}
                contentStyle={{ backgroundColor: '#12121e', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <Line type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
