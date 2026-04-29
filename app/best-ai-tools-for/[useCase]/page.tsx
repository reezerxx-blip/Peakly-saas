import Link from 'next/link';
import { Navigation } from '@/components/navigation';
import { PremiumPageShell } from '@/components/ui/premium-page-shell';
import { getTools } from '@/lib/get-tools';
import { inferToolTraits, matchesDiscoveryQuery } from '@/lib/tool-discovery';

export async function generateMetadata({ params }: { params: Promise<{ useCase: string }> }) {
  const resolved = await params;
  const useCase = decodeURIComponent(resolved.useCase ?? '').replace(/-/g, ' ');
  return {
    title: `Best AI tools for ${useCase} - Peakly`,
    description: `Discover and compare the best AI tools for ${useCase}, with pricing and trend insights.`,
  };
}

export default async function BestAiToolsForPage({
  params,
}: {
  params: Promise<{ useCase: string }>;
}) {
  const resolved = await params;
  const useCase = decodeURIComponent(resolved.useCase ?? '').replace(/-/g, ' ');
  const tools = await getTools();
  const matches = tools
    .filter((tool) => matchesDiscoveryQuery(tool, useCase))
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, 20);

  return (
    <PremiumPageShell>
      <Navigation />
      <div className="container mx-auto px-4 py-7 space-y-6">
        <div>
          <h1 className="premium-hero-title text-[44px] font-extrabold leading-[1.05] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
            Best AI tools for {useCase}
          </h1>
          <p className="text-white/55 mt-2">
            Curated by trend signals, growth and product readiness. Updated continuously by Peakly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {matches.map((tool) => {
            const traits = inferToolTraits(tool);
            return (
              <Link key={tool.id} href={`/tool/${tool.id}`} className="rounded-xl border border-white/10 bg-[#0d0d1a] p-4 hover:border-accent">
                <p className="font-bold text-white">{tool.name}</p>
                <p className="text-xs text-white/50 mt-1">{tool.category}</p>
                <p className="text-sm text-white/70 mt-2 line-clamp-2">{tool.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-white/75">
                    {tool.pricing ?? 'unknown'}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-white/75">
                    {traits.aiType}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-white/75">
                    score {tool.trendingScore.toFixed(1)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </PremiumPageShell>
  );
}
