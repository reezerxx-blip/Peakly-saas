'use client';

import { news } from '@/lib/data';
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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

export function NewsFeed({ lang = 'fr' }: { lang?: Language }) {
  const dateFormatter = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="bg-card rounded-lg border border-border p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-accent" />
        <h2 className="font-bold text-lg">
          {lang === 'fr' ? 'Dernieres actualites' : 'Latest News'}
        </h2>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {news.map((item) => (
          <a
            key={item.id}
            href={`https://www.google.com/search?q=${encodeURIComponent(`${item.source} ${item.title}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-background rounded-lg border border-border hover:border-accent transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-2">
              <SentimentIcon sentiment={item.sentiment} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{item.source}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {dateFormatter.format(new Date(item.date))}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
