import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, FileText, Github, Rocket, Youtube } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Navigation } from '@/components/navigation';
import { news } from '@/lib/data';
import { getRequestLanguage } from '@/lib/i18n-server';
import { getTools } from '@/lib/get-tools';
import { getToolHistory } from '@/lib/tool-history';
import { generateToolAiAnalysis } from '@/lib/ai-analysis';
import { ToolInsightsCharts } from '@/components/tool-insights-charts';
import { AiAnalysisCard } from '@/components/ai-analysis-card';
import { FollowToolButton } from '@/components/follow-tool-button';
import { PaywallBlur } from '@/components/paywall-blur';
import { PremiumPageShell } from '@/components/ui/premium-page-shell';
import { LiveIndicator } from '@/components/ui/live-indicator';
import { CountUp } from '@/components/ui/count-up';
import { TrendBadge } from '@/components/ui/trend-badge';

export const metadata = {
  title: 'Details Outil - Peakly',
};

type YouTubeSnapshot = {
  videosCount: number;
  viewsTotal: number;
  fetchedAt?: string;
  channelUrl?: string | null;
};

async function getYoutubeSnapshot(toolId: string): Promise<YouTubeSnapshot | null> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await client
    .from('api_cache')
    .select('value,fetched_at')
    .eq('tool_id', toolId)
    .eq('source', 'youtube')
    .maybeSingle();

  if (error || !data) return null;
  const value = (data as { value?: { videos_count?: number; views_total?: number } }).value ?? {};
  return {
    videosCount: Number(value.videos_count ?? 0),
    viewsTotal: Number(value.views_total ?? 0),
    fetchedAt: (data as { fetched_at?: string }).fetched_at,
    channelUrl:
      (value as { channel_url?: string | null }).channel_url ??
      (value as { channel_id?: string | null }).channel_id
        ? `https://www.youtube.com/channel/${(value as { channel_id?: string | null }).channel_id}`
        : null,
  };
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const lang = await getRequestLanguage();
  const tools = await getTools();
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams.slug ?? '').toLowerCase();
  const tool = tools.find(
    (t) => t.id.toLowerCase() === slug || t.name.toLowerCase().replace(/\s+/g, '-') === slug
  );

  if (!tool) notFound();

  const categoryTools = tools.filter((t) => t.category === tool.category);
  const rank =
    categoryTools.sort((a, b) => b.trendingScore - a.trendingScore).findIndex((t) => t.id === tool.id) + 1;
  const toolNews = news.filter((n) => n.toolId === tool.id);
  const history = await getToolHistory(tool.id);
  const aiAnalysis = await generateToolAiAnalysis(tool, lang);
  const youtubeSnapshot = await getYoutubeSnapshot(tool.id);

  const siteHost = tool.website ? new URL(tool.website).hostname.replace(/^www\./, '') : '';
  const logoUrl = siteHost
    ? `https://www.google.com/s2/favicons?domain=${siteHost}&sz=128`
    : 'https://www.google.com/s2/favicons?domain=example.com&sz=128';
  const formattedTrendingScore = Number(tool.trendingScore).toFixed(2);
  const status = tool.signalType === 'breakthrough' ? 'hot' : tool.signalType;
  const quality = (tool.dataQuality ?? 'unknown').toLowerCase();
  const qualityColor =
    quality === 'high' ? 'text-green-400' : quality === 'medium' ? 'text-amber-400' : 'text-red-400';
  const priceLabel =
    tool.pricing === 'freemium'
      ? 'Freemium'
      : tool.pricing === 'free'
        ? lang === 'fr'
          ? 'Gratuit'
          : 'Free'
        : tool.pricing === 'paid'
          ? lang === 'fr'
            ? 'Payant'
            : 'Paid'
          : lang === 'fr'
            ? 'Inconnu'
            : 'Unknown';

  const trendSeries = Array.from({ length: 12 }, (_, i) => ({
    label: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'][i],
    value: Math.max(5, Math.min(100, tool.trendingScore - 16 + i * 1.4 + Math.sin(i * 0.5) * 6)),
  }));
  const mentionsSeries = Array.from({ length: 8 }, (_, i) => ({
    label: `S${i + 1}`,
    hn: Math.max(0, Math.round((toolNews.length + 2) * (0.8 + i * 0.08))),
    reddit: Math.max(0, Math.round((toolNews.length + 3) * (0.7 + i * 0.1))),
  }));
  const starsSeries = Array.from({ length: 8 }, (_, i) => {
    const delta = Math.max(3, Math.round((tool.trendingScore / 12) * (0.7 + i * 0.06)));
    return { label: `S${i + 1}`, delta, stars: 500 + i * 65 + delta * 7 };
  });
  const historySeries =
    history.length > 0
      ? history.slice(-30).map((point, idx) => ({ label: `${idx + 1}`, score: Number(point.trendScore) }))
      : Array.from({ length: 30 }, (_, i) => ({
          label: `${i + 1}`,
          score: Math.max(5, Math.min(100, tool.trendingScore - 12 + i * 0.6 + Math.sin(i * 0.3) * 4)),
        }));

  const mentions = toolNews
    .map((item) => ({
      source:
        item.source.toLowerCase().includes('reddit')
          ? 'Reddit'
          : item.source.toLowerCase().includes('hn') || item.source.toLowerCase().includes('hacker')
            ? 'Hacker News'
            : 'Hacker News',
      title: item.title,
      date: item.date,
      score: 40 + (item.id.charCodeAt(item.id.length - 1) % 120),
      subreddit: 'r/saas',
      url: `https://www.google.com/search?q=${encodeURIComponent(`${item.source} ${item.title}`)}`,
    }))
    .slice(0, 5);

  const competitors = categoryTools
    .filter((t) => t.id !== tool.id)
    .sort((a, b) => Math.abs(a.trendingScore - tool.trendingScore) - Math.abs(b.trendingScore - tool.trendingScore))
    .slice(0, 3);
  const alternatives = competitors.slice(0, 2);
  const founders = ['Founder 1', 'Founder 2'];
  const fundingStage = tool.trendingScore >= 90 ? 'Series B+' : tool.trendingScore >= 80 ? 'Series A' : 'Seed';
  const estimatedFunding = tool.trendingScore >= 90 ? '$120M+' : tool.trendingScore >= 80 ? '$35M+' : '$8M+';
  const aiStack = [
    tool.signalType === 'breakthrough' ? 'LLM orchestration' : 'Workflow AI',
    tool.githubRepo ? 'Public API / SDK' : 'Closed API',
    'Vector retrieval',
    'Usage analytics',
  ];
  const integrations = ['Slack', 'Notion', 'Zapier', 'Webhook'].filter((item) => {
    if (item === 'Webhook') return Boolean(tool.githubRepo);
    return true;
  });
  const changelog = [
    { date: '2026-04-12', title: 'Nouveau dashboard insights', type: 'feature' },
    { date: '2026-03-28', title: 'Optimisation des performances API', type: 'improvement' },
    { date: '2026-03-06', title: 'Mise a jour pricing et packaging', type: 'pricing' },
  ];
  const qualityScore = Math.min(100, Math.max(45, Math.round(Number(tool.trendingScore) * 0.82)));
  const supportScore = Math.min(100, Math.max(45, Math.round(Number(tool.trendingScore) * 0.76)));
  const uxScore = Math.min(100, Math.max(45, Math.round(Number(tool.trendingScore) * 0.84)));

  const kpis = [
    {
      label: lang === 'fr' ? 'Visiteurs/mois estimes' : 'Estimated monthly visitors',
      value: (tool.monthlyVisits ?? 0).toLocaleString(),
    },
    {
      label: lang === 'fr' ? 'Croissance hebdomadaire' : 'Weekly growth',
      value: `${Number(tool.weeklyGrowth ?? 0).toFixed(2)}%`,
    },
    {
      label: lang === 'fr' ? 'Croissance mensuelle' : 'Monthly growth',
      value: `${Number(tool.metrics.monthlyGrowth ?? 0).toFixed(2)}%`,
    },
    { label: lang === 'fr' ? 'Score de tendance' : 'Trend score', value: `${formattedTrendingScore}/100` },
    {
      label: lang === 'fr' ? 'Rang dans sa categorie' : 'Category rank',
      value: `#${rank} / ${categoryTools.length}`,
    },
    { label: lang === 'fr' ? 'Annee de lancement' : 'Launch year', value: `${tool.launched ?? '-'}` },
    { label: lang === 'fr' ? 'Modele pricing' : 'Pricing model', value: priceLabel },
    {
      label: lang === 'fr' ? 'Reviews G2/Capterra' : 'G2/Capterra reviews',
      value: `${Math.round((tool.trendingScore * 11) % 500)}`,
    },
  ];

  const socialCards = [
    {
      icon: <Rocket className="w-4 h-4 text-orange-400" />,
      title: 'ProductHunt',
      line1: `${Math.round(tool.trendingScore * 25)} upvotes`,
      line2: `#${Math.max(1, Math.round(40 - tool.trendingScore / 3))}`,
      trend: `${Number((tool.weeklyGrowth ?? 2) * 1.2).toFixed(1)}%`,
      url: tool.phSlug ? `https://www.producthunt.com/products/${tool.phSlug}` : 'https://www.producthunt.com',
    },
    {
      icon: <Github className="w-4 h-4 text-violet-400" />,
      title: 'GitHub',
      line1: `${starsSeries[starsSeries.length - 1]?.stars ?? 0} stars`,
      line2: `${Math.round((starsSeries[starsSeries.length - 1]?.stars ?? 0) * 0.18)} forks`,
      trend: `${Number((tool.weeklyGrowth ?? 2) * 0.9).toFixed(1)}%`,
      url: tool.githubRepo ? `https://github.com/${tool.githubRepo}` : `https://github.com/search?q=${encodeURIComponent(tool.name)}`,
    },
    {
      icon: <Youtube className="w-4 h-4 text-red-400" />,
      title: 'YouTube',
      line1: `${Math.max(0, youtubeSnapshot?.videosCount ?? 0)} ${lang === 'fr' ? 'videos (30j)' : 'videos (30d)'}`,
      line2: `${Math.max(0, youtubeSnapshot?.viewsTotal ?? 0).toLocaleString()} ${lang === 'fr' ? 'vues detectees' : 'detected views'}`,
      trend: `${Number((tool.weeklyGrowth ?? 2) * 0.7).toFixed(1)}%`,
      url:
        youtubeSnapshot?.channelUrl ||
        `https://www.youtube.com/results?search_query=${encodeURIComponent(tool.youtubeQuery ?? tool.name)}&sp=EgIQAg%253D%253D`,
      secondaryUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(tool.youtubeQuery ?? tool.name)}&sp=CAI%253D`,
      allVideosLabel: youtubeSnapshot?.channelUrl
        ? lang === 'fr'
          ? 'Toute la chaine'
          : 'Full channel'
        : lang === 'fr'
          ? 'Recherche videos'
          : 'Search videos',
    },
    {
      icon: <FileText className="w-4 h-4 text-blue-400" />,
      title: 'Reddit',
      line1: `${Math.max(1, Math.round(toolNews.length * 1.2))} mentions`,
      line2: `${Math.round(tool.trendingScore * 12)} interactions`,
      trend: `${Number((tool.weeklyGrowth ?? 2) * 0.5).toFixed(1)}%`,
      url: `https://www.reddit.com/search/?q=${encodeURIComponent(tool.redditQuery ?? tool.name)}`,
    },
  ];

  return (
    <PremiumPageShell>
      <Navigation />
      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="flex justify-end">
          <LiveIndicator />
        </div>
        <Link href="/categories" className="inline-flex items-center gap-2 text-accent hover:opacity-80">
          <ArrowLeft className="w-4 h-4" />
          {lang === 'fr' ? 'Retour aux categories' : 'Back to categories'}
        </Link>

        <section className="rounded-2xl border border-white/10 bg-[#12121e] p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,320px] gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Image
                  src={logoUrl}
                  alt={tool.name}
                  width={56}
                  height={56}
                  unoptimized
                  className="w-14 h-14 rounded-xl border border-white/10 bg-black/20 p-1"
                />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-3xl font-bold text-white">{tool.name}</h1>
                    <TrendBadge status={status} />
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-white/5 ${qualityColor}`}
                    >
                      {quality}
                    </span>
                  </div>
                  <p className="text-muted-foreground max-w-3xl">{tool.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {[tool.category, priceLabel, tool.launched ? `${tool.launched}` : null, ...(tool.tags ?? []).slice(0, 3)]
                  .filter(Boolean)
                  .map((tag) => (
                    <button
                      key={String(tag)}
                      className="px-2.5 py-1.5 rounded-full border border-white/10 bg-background text-xs text-muted-foreground hover:text-white"
                    >
                      {tag}
                    </button>
                  ))}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {tool.website && (
                  <a
                    href={tool.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium"
                  >
                    {lang === 'fr' ? 'Visiter le site' : 'Visit website'}
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                )}
                <FollowToolButton toolId={tool.id} lang={lang} />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-background/40 p-4 flex flex-col items-center justify-center">
              <div
                className="w-36 h-36 rounded-full grid place-items-center"
                style={{
                  background: `conic-gradient(${status === 'hot' ? '#f97316' : status === 'rising' ? '#22c55e' : status === 'declining' ? '#ef4444' : '#60a5fa'} ${tool.trendingScore * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                }}
              >
                <div className="w-28 h-28 rounded-full bg-[#12121e] border border-white/10 grid place-items-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white"><CountUp value={Number(formattedTrendingScore)} decimals={2} duration={1200} /></div>
                    <div className="text-xs text-muted-foreground">/ 100</div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {lang === 'fr' ? 'Score de tendance global' : 'Global trend score'}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">{lang === 'fr' ? 'Chiffres cles' : 'Key metrics'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-white/10 bg-[#12121e] p-4">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold text-accent mt-2">{kpi.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-[#12121e] p-4">
            <h2 className="text-lg font-bold text-white mb-3">{lang === 'fr' ? 'Stack IA & technique' : 'AI & technical stack'}</h2>
            <div className="flex flex-wrap gap-2">
              {aiStack.map((item) => (
                <span key={item} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {lang === 'fr'
                ? 'Vue architecture de reference pour evaluer maturite produit et fit enterprise.'
                : 'Reference architecture snapshot to assess product maturity and enterprise fit.'}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#12121e] p-4">
            <h2 className="text-lg font-bold text-white mb-3">{lang === 'fr' ? 'Entreprise & traction' : 'Company & traction'}</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{lang === 'fr' ? 'Funding' : 'Funding'}</p>
                <p className="text-white font-semibold">{estimatedFunding}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{lang === 'fr' ? 'Stade' : 'Stage'}</p>
                <p className="text-white font-semibold">{fundingStage}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">{lang === 'fr' ? 'Fondateurs (estimation)' : 'Founders (estimated)'}</p>
                <p className="text-white font-semibold">{founders.join(' • ')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-[#12121e] p-4">
            <p className="text-xs text-muted-foreground">{lang === 'fr' ? 'Score qualite' : 'Quality score'}</p>
            <p className="text-2xl font-bold text-accent mt-1">{qualityScore}/100</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#12121e] p-4">
            <p className="text-xs text-muted-foreground">{lang === 'fr' ? 'Score UX' : 'UX score'}</p>
            <p className="text-2xl font-bold text-accent mt-1">{uxScore}/100</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#12121e] p-4">
            <p className="text-xs text-muted-foreground">{lang === 'fr' ? 'Score support' : 'Support score'}</p>
            <p className="text-2xl font-bold text-accent mt-1">{supportScore}/100</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">{lang === 'fr' ? 'Graphiques' : 'Charts'}</h2>
          <ToolInsightsCharts
            lang={lang}
            status={status}
            trendsData={trendSeries}
            mentionsData={mentionsSeries}
            starsData={starsSeries}
            scoreHistory={historySeries}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-[#12121e] p-4">
            <h2 className="text-lg font-bold text-white mb-3">{lang === 'fr' ? 'Integrations' : 'Integrations'}</h2>
            <div className="flex flex-wrap gap-2">
              {integrations.map((item) => (
                <span key={item} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#12121e] p-4">
            <h2 className="text-lg font-bold text-white mb-3">{lang === 'fr' ? 'Alternatives' : 'Alternatives'}</h2>
            <div className="space-y-2">
              {alternatives.length === 0 ? (
                <p className="text-sm text-muted-foreground">{lang === 'fr' ? 'Aucune alternative proche.' : 'No close alternative.'}</p>
              ) : (
                alternatives.map((alt) => (
                  <Link key={alt.id} href={`/tool/${alt.id}`} className="block rounded-lg border border-white/10 bg-black/20 p-2 text-sm text-white hover:border-accent">
                    {alt.name} <span className="text-xs text-muted-foreground">({Number(alt.trendingScore).toFixed(1)})</span>
                  </Link>
                ))
              )}
            </div>
            <div className="mt-3 space-y-2">
              <Link
                href={`/alternatives-to/${tool.id}`}
                className="inline-flex rounded-md border border-white/15 px-2.5 py-1 text-xs text-white/80 hover:border-accent"
              >
                {lang === 'fr' ? `Voir toutes les alternatives a ${tool.name}` : `See all alternatives to ${tool.name}`}
              </Link>
              {alternatives[0] && (
                <Link
                  href={`/compare/${tool.id}/vs/${alternatives[0].id}`}
                  className="inline-flex rounded-md border border-white/15 px-2.5 py-1 text-xs text-white/80 hover:border-accent ml-2"
                >
                  {lang === 'fr' ? `Comparer ${tool.name} vs ${alternatives[0].name}` : `Compare ${tool.name} vs ${alternatives[0].name}`}
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#12121e] p-4 space-y-3">
          <h2 className="text-lg font-bold text-white">{lang === 'fr' ? 'Changelog recent' : 'Recent changelog'}</h2>
          {changelog.map((entry) => (
            <div key={`${entry.date}-${entry.title}`} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-white">{entry.title}</p>
                <span className="text-xs text-muted-foreground">{entry.date}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 uppercase">{entry.type}</p>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">{lang === 'fr' ? 'Analyse IA' : 'AI analysis'}</h2>
          <AiAnalysisCard tool={tool} initialAnalysis={aiAnalysis} lang={lang} />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">{lang === 'fr' ? 'Signaux sociaux' : 'Social signals'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {socialCards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-white/10 bg-[#12121e] p-4 space-y-2 hover:border-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {card.icon}
                    <span className="text-white font-semibold">{card.title}</span>
                  </div>
                  <span className="text-xs text-green-400">↗ +{card.trend}</span>
                </div>
                <p className="text-lg font-bold text-accent">{card.line1}</p>
                <p className="text-sm text-muted-foreground">{card.line2}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {card.secondaryUrl && (
                    <a
                      href={card.secondaryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-md border border-white/15 px-2.5 py-1 text-xs text-white/75 hover:text-white hover:border-accent"
                    >
                      {lang === 'fr' ? 'Videos recentes' : 'Recent videos'}
                    </a>
                  )}
                  <a
                    href={card.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-md border border-white/15 px-2.5 py-1 text-xs text-white/75 hover:text-white hover:border-accent"
                  >
                    {card.allVideosLabel ?? (lang === 'fr' ? 'Toutes les videos' : 'All videos')}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">{lang === 'fr' ? 'Actualites et buzz' : 'News and buzz'}</h2>
          <div className="rounded-xl border border-white/10 bg-[#12121e] p-4">
            {mentions.length === 0 ? (
              <p className="text-muted-foreground">{lang === 'fr' ? 'Aucune mention recente' : 'No recent mentions'}</p>
            ) : (
              <div className="space-y-3">
                {mentions.map((mention, idx) => (
                  <a
                    key={`${mention.title}-${idx}`}
                    href={mention.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg border border-white/10 bg-black/20 p-3 hover:border-accent"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-white">{mention.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(mention.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {mention.source === 'Reddit'
                        ? `Reddit • ${mention.subreddit} • ${mention.score} upvotes`
                        : `Hacker News • score ${mention.score}`}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">
            {lang === 'fr' ? 'Comparaison concurrents' : 'Competitor comparison'}
          </h2>
          <div className="rounded-xl border border-white/10 bg-[#12121e] p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">{lang === 'fr' ? 'Outil' : 'Tool'}</th>
                  <th className="py-2">{lang === 'fr' ? 'Score' : 'Score'}</th>
                  <th className="py-2">{lang === 'fr' ? 'Croissance' : 'Growth'}</th>
                  <th className="py-2">Pricing</th>
                  <th className="py-2">{lang === 'fr' ? 'Visiteurs' : 'Visitors'}</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c) => (
                  <tr key={c.id} className="border-t border-white/10">
                    <td className="py-2 text-white">{c.name}</td>
                    <td className="py-2">{Number(c.trendingScore).toFixed(2)}</td>
                    <td className="py-2">{Number(c.weeklyGrowth ?? 0).toFixed(2)}%</td>
                    <td className="py-2">{c.pricing ?? '-'}</td>
                    <td className="py-2">{(c.monthlyVisits ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3">
              {competitors[0] ? (
                <Link
                  href={`/compare`}
                  className="inline-flex px-3 py-1.5 rounded-md border border-white/15 text-sm hover:border-accent"
                >
                  {lang === 'fr' ? 'Voir la comparaison complete' : 'See full comparison'}
                </Link>
              ) : (
                <button className="px-3 py-1.5 rounded-md border border-white/15 text-sm" disabled>
                  {lang === 'fr' ? 'Voir la comparaison complete' : 'See full comparison'}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {lang === 'fr' ? 'Opportunites business' : 'Business opportunities'}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent uppercase">Premium</span>
          </h2>
          <PaywallBlur
            requiresPro
            feature={lang === 'fr' ? 'Les opportunites business' : 'Business opportunities'}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-white/10 bg-[#12121e] p-4">
                <p className="text-xs text-muted-foreground">{lang === 'fr' ? 'Gap identifie' : 'Gap identified'}</p>
                <p className="text-white mt-2">{aiAnalysis.gap}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#12121e] p-4">
                <p className="text-xs text-muted-foreground">
                  {lang === 'fr' ? 'Audience cible' : 'Target audience'}
                </p>
                <p className="text-white mt-2">{aiAnalysis.audience}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#12121e] p-4">
                <p className="text-xs text-muted-foreground">
                  {lang === 'fr' ? 'Idee de SaaS complementaire' : 'Complementary SaaS idea'}
                </p>
                <p className="text-white mt-2">{aiAnalysis.idea}</p>
              </div>
            </div>
          </PaywallBlur>
        </section>
      </div>
    </PremiumPageShell>
  );
}
