import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Tool, NewsItem } from '@/lib/data';
import type { Language } from '@/lib/i18n-types';

function SentimentIcon({ sentiment }: { sentiment: 'positive' | 'neutral' | 'negative' }) {
  switch (sentiment) {
    case 'positive':
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'negative':
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    default:
      return <Minus className="w-4 h-4 text-blue-500" />;
  }
}

export function ToolNews({ tool, news, lang = 'fr' }: { tool: Tool; news: NewsItem[]; lang?: Language }) {
  const dateFormatter = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (news.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 text-center">
        <p className="text-muted-foreground">
          {lang === 'fr'
            ? `Aucune actualite recente disponible pour ${tool.name}`
            : `No recent news available for ${tool.name}`}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-xl font-bold mb-4">
        {lang === 'fr' ? `Actualites recentes (${news.length})` : `Recent News (${news.length})`}
      </h2>

      <div className="space-y-3">
        {news.map((item) => (
          <a
            key={item.id}
            href={`https://www.google.com/search?q=${encodeURIComponent(`${item.source} ${item.title}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-background rounded-lg border border-border hover:border-accent transition-colors"
          >
            <div className="flex items-start gap-3 mb-2">
              <SentimentIcon sentiment={item.sentiment} />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground line-clamp-2">{item.title}</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{item.summary}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{item.source}</span>
              <span>{dateFormatter.format(new Date(item.date))}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
