'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Tool } from '@/lib/data';
import type { ToolHistoryPoint } from '@/lib/tool-history';
import type { Language } from '@/lib/i18n-types';

export function ToolMetrics({
  tool,
  history = [],
  lang = 'fr',
}: {
  tool: Tool;
  history?: ToolHistoryPoint[];
  lang?: Language;
}) {
  const synthetic = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    trending: Math.max(30, tool.trendingScore - 20 + Math.sin(i * 0.45) * 10),
    adoption: Math.max(40, tool.metrics.adoptionRate - 20 + Math.cos(i * 0.35) * 10),
  }));
  const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' });
  const historicalData =
    history.length >= 3
      ? history.map((point) => ({
          month: dateFormatter.format(new Date(point.recordedAt)),
          trending: point.trendScore,
          adoption: Math.max(30, Math.min(100, point.trendScore * 0.85)),
        }))
      : synthetic;

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-xl font-bold mb-6">{lang === 'fr' ? 'Metriques et tendances' : 'Metrics & Trends'}</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={historicalData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" stroke="var(--muted-foreground)" />
          <YAxis stroke="var(--muted-foreground)" />
          <Tooltip
            formatter={(value: number, name: string) => [
              Number(value).toFixed(2),
              name,
            ]}
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: `1px solid var(--border)`,
              borderRadius: '8px',
              color: 'var(--foreground)',
            }}
            labelStyle={{ color: 'var(--foreground)' }}
          />
          <Line
            type="monotone"
            dataKey="trending"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            name={lang === 'fr' ? 'Score de tendance' : 'Trending Score'}
          />
          <Line
            type="monotone"
            dataKey="adoption"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={false}
            name={lang === 'fr' ? "Taux d'adoption" : 'Adoption Rate'}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span className="text-sm text-muted-foreground">
            {lang === 'fr' ? 'Score de tendance' : 'Trending Score'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">
            {lang === 'fr' ? "Taux d'adoption" : 'Adoption Rate'}
          </span>
        </div>
      </div>
    </div>
  );
}
