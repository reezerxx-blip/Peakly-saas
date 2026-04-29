import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { PremiumPageShell } from '@/components/ui/premium-page-shell';
import { getTools } from '@/lib/get-tools';
import { inferToolTraits } from '@/lib/tool-discovery';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ left: string; right: string }>;
}) {
  const resolved = await params;
  const left = decodeURIComponent(resolved.left ?? '');
  const right = decodeURIComponent(resolved.right ?? '');
  return {
    title: `${left} vs ${right} - Peakly Compare`,
    description: `Compare ${left} and ${right} across pricing, API, growth, and trend score.`,
  };
}

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

export default async function CompareVsPage({
  params,
}: {
  params: Promise<{ left: string; right: string }>;
}) {
  const resolved = await params;
  const leftSlug = normalize(decodeURIComponent(resolved.left ?? ''));
  const rightSlug = normalize(decodeURIComponent(resolved.right ?? ''));
  const tools = await getTools();

  const left = tools.find((tool) => normalize(tool.id) === leftSlug || normalize(tool.name).replace(/\s+/g, '-') === leftSlug);
  const right = tools.find((tool) => normalize(tool.id) === rightSlug || normalize(tool.name).replace(/\s+/g, '-') === rightSlug);
  if (!left || !right) notFound();

  const leftTraits = inferToolTraits(left);
  const rightTraits = inferToolTraits(right);

  const rows = [
    { label: 'Pricing', left: left.pricing ?? '-', right: right.pricing ?? '-' },
    { label: 'Trend score', left: left.trendingScore.toFixed(2), right: right.trendingScore.toFixed(2) },
    { label: 'Monthly growth', left: `${left.metrics.monthlyGrowth.toFixed(2)}%`, right: `${right.metrics.monthlyGrowth.toFixed(2)}%` },
    { label: 'Monthly visitors', left: (left.monthlyVisits ?? 0).toLocaleString(), right: (right.monthlyVisits ?? 0).toLocaleString() },
    { label: 'API', left: leftTraits.hasApi ? 'Yes' : 'No', right: rightTraits.hasApi ? 'Yes' : 'No' },
    { label: 'Open-source', left: leftTraits.openSource ? 'Yes' : 'No', right: rightTraits.openSource ? 'Yes' : 'No' },
    { label: 'No-code', left: leftTraits.noCode ? 'Yes' : 'No', right: rightTraits.noCode ? 'Yes' : 'No' },
    { label: 'Self-hosted', left: leftTraits.selfHosted ? 'Yes' : 'No', right: rightTraits.selfHosted ? 'Yes' : 'No' },
  ];

  return (
    <PremiumPageShell>
      <Navigation />
      <div className="container mx-auto px-4 py-7 space-y-6">
        <div>
          <h1 className="premium-hero-title text-[44px] font-extrabold leading-[1.05] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
            {left.name} vs {right.name}
          </h1>
          <p className="text-white/55 mt-2">Head-to-head comparison on core SaaS and AI criteria.</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0d0d1a] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/70 border-b border-white/10">
                <th className="p-3 text-left">Criteria</th>
                <th className="p-3 text-left">{left.name}</th>
                <th className="p-3 text-left">{right.name}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-white/5 last:border-b-0">
                  <td className="p-3 text-white/60">{row.label}</td>
                  <td className="p-3 text-white">{row.left}</td>
                  <td className="p-3 text-white">{row.right}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <Link href={`/tool/${left.id}`} className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:border-accent">
            View {left.name}
          </Link>
          <Link href={`/tool/${right.id}`} className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:border-accent">
            View {right.name}
          </Link>
        </div>
      </div>
    </PremiumPageShell>
  );
}
