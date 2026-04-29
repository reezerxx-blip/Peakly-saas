import { TrendingUp, TrendingDown, AlertCircle, Minus } from 'lucide-react';
import Link from 'next/link';
import type { Tool } from '@/lib/data';

export function ToolCard({ tool }: { tool: Tool }) {
  const signalIcons = {
    breakthrough: <TrendingUp className="w-4 h-4 text-orange-500" />,
    rising: <TrendingUp className="w-4 h-4 text-green-500" />,
    stable: <AlertCircle className="w-4 h-4 text-blue-500" />,
    declining: <TrendingDown className="w-4 h-4 text-red-500" />,
  };

  const signalColors = {
    breakthrough: 'text-orange-500',
    rising: 'text-green-500',
    stable: 'text-blue-500',
    declining: 'text-red-500',
  };

  return (
    <Link href={`/tool/${tool.id}`}>
      <div className="p-4 rounded-lg border border-border bg-card hover:border-accent hover:shadow-lg transition-all group cursor-pointer h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-1">
              {tool.name}
            </h3>
            <p className="text-xs text-muted-foreground">{tool.category}</p>
          </div>
          <div className={`flex-shrink-0 ${signalColors[tool.signalType]}`}>
            {signalIcons[tool.signalType]}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
          {tool.description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-accent">{tool.trendingScore}</span>
            <span className="text-xs text-muted-foreground">trending</span>
          </div>
          {tool.trending && (
            <div className="px-2 py-1 rounded-full bg-accent bg-opacity-10 text-accent text-xs font-semibold">
              Trending
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function SignalBadge({ type }: { type: 'breakthrough' | 'rising' | 'stable' | 'declining' }) {
  const badgeStyles = {
    breakthrough: 'bg-orange-500 bg-opacity-10 text-orange-500 border-orange-500 border-opacity-30',
    rising: 'bg-green-500 bg-opacity-10 text-green-500 border-green-500 border-opacity-30',
    stable: 'bg-blue-500 bg-opacity-10 text-blue-500 border-blue-500 border-opacity-30',
    declining: 'bg-red-500 bg-opacity-10 text-red-500 border-red-500 border-opacity-30',
  };

  const icons = {
    breakthrough: <TrendingUp className="w-3 h-3" />,
    rising: <TrendingUp className="w-3 h-3" />,
    stable: <Minus className="w-3 h-3" />,
    declining: <TrendingDown className="w-3 h-3" />,
  };

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-semibold ${badgeStyles[type]}`}
    >
      {icons[type]}
      <span className="capitalize">{type}</span>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  unit = '',
  trend,
}: {
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColor = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-blue-500',
  };

  const trendIcon = {
    up: <TrendingUp className="w-4 h-4" />,
    down: <TrendingDown className="w-4 h-4" />,
    neutral: <AlertCircle className="w-4 h-4" />,
  };

  return (
    <div className="p-4 rounded-lg bg-card border border-border">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-foreground">
          {value}
          <span className="text-sm text-muted-foreground ml-1">{unit}</span>
        </span>
        {trend && (
          <div className={`flex-shrink-0 ${trendColor[trend]}`}>{trendIcon[trend]}</div>
        )}
      </div>
    </div>
  );
}
