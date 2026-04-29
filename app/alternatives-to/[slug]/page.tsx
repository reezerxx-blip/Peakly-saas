import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { PremiumPageShell } from '@/components/ui/premium-page-shell';
import { getTools } from '@/lib/get-tools';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const slug = decodeURIComponent(resolved.slug ?? '').toLowerCase();
  const titleName = slug.replace(/-/g, ' ');
  return {
    title: `Alternatives to ${titleName} - Peakly`,
    description: `Compare top alternatives to ${titleName} with pricing, trend score and growth signals.`,
  };
}

export default async function AlternativesToPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const slug = decodeURIComponent(resolved.slug ?? '').toLowerCase();
  const tools = await getTools();
  const target = tools.find((tool) => tool.id.toLowerCase() === slug || tool.name.toLowerCase().replace(/\s+/g, '-') === slug);
  if (!target) notFound();

  const alternatives = tools
    .filter((tool) => tool.id !== target.id && tool.category === target.category)
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, 12);

  return (
    <PremiumPageShell>
      <Navigation />
      <div className="container mx-auto px-4 py-7 space-y-6">
        <div>
          <h1 className="premium-hero-title text-[44px] font-extrabold leading-[1.05] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
            Alternatives to {target.name}
          </h1>
          <p className="text-white/55 mt-2">
            Discover similar AI tools in {target.category}, ranked by trend score and growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {alternatives.map((tool) => (
            <Link key={tool.id} href={`/tool/${tool.id}`} className="rounded-xl border border-white/10 bg-[#0d0d1a] p-4 hover:border-accent">
              <p className="font-bold text-white">{tool.name}</p>
              <p className="text-xs text-white/50 mt-1">{tool.category}</p>
              <p className="text-sm text-white/70 mt-2 line-clamp-2">{tool.description}</p>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-white/80">
                  {tool.pricing ?? 'unknown'}
                </span>
                <span className="text-accent">{tool.trendingScore.toFixed(1)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PremiumPageShell>
  );
}
