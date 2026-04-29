'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/navigation';
import { PremiumPageShell } from '@/components/ui/premium-page-shell';
import type { AppTool } from '@/lib/get-tools';
import { inferToolTraits } from '@/lib/tool-discovery';

export default function ComparePage() {
  const [tools, setTools] = useState<AppTool[]>([]);
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');

  useEffect(() => {
    void fetch('/api/tools')
      .then((response) => response.json())
      .then((payload: { tools?: AppTool[] }) => {
        const list = payload.tools ?? [];
        setTools(list);
        setLeftId(list[0]?.id ?? '');
        setRightId(list[1]?.id ?? list[0]?.id ?? '');
      });
  }, []);

  const left = useMemo(() => tools.find((tool) => tool.id === leftId) ?? null, [tools, leftId]);
  const right = useMemo(() => tools.find((tool) => tool.id === rightId) ?? null, [tools, rightId]);
  const matchupLinks = useMemo(
    () =>
      tools
        .slice(0, 12)
        .flatMap((leftTool, idx, arr) =>
          arr.slice(idx + 1, idx + 2).map((rightTool) => ({
            id: `${leftTool.id}-${rightTool.id}`,
            label: `${leftTool.name} vs ${rightTool.name}`,
            href: `/compare/${encodeURIComponent(leftTool.id)}/vs/${encodeURIComponent(rightTool.id)}`,
          }))
        )
        .slice(0, 8),
    [tools]
  );

  const rows = useMemo(() => {
    if (!left || !right) return [];
    const leftTraits = inferToolTraits(left);
    const rightTraits = inferToolTraits(right);
    return [
      { label: 'Pricing', left: left.pricing ?? '-', right: right.pricing ?? '-' },
      { label: 'Trend score', left: left.trendingScore.toFixed(2), right: right.trendingScore.toFixed(2) },
      { label: 'Monthly growth', left: `${left.metrics.monthlyGrowth.toFixed(2)}%`, right: `${right.metrics.monthlyGrowth.toFixed(2)}%` },
      { label: 'Monthly visits', left: (left.monthlyVisits ?? 0).toLocaleString(), right: (right.monthlyVisits ?? 0).toLocaleString() },
      { label: 'API', left: leftTraits.hasApi ? 'Yes' : 'No', right: rightTraits.hasApi ? 'Yes' : 'No' },
      { label: 'Open-source', left: leftTraits.openSource ? 'Yes' : 'No', right: rightTraits.openSource ? 'Yes' : 'No' },
      { label: 'No-code', left: leftTraits.noCode ? 'Yes' : 'No', right: rightTraits.noCode ? 'Yes' : 'No' },
      { label: 'Self-hosted', left: leftTraits.selfHosted ? 'Yes' : 'No', right: rightTraits.selfHosted ? 'Yes' : 'No' },
      { label: 'AI type', left: leftTraits.aiType, right: rightTraits.aiType },
      { label: 'Audience', left: leftTraits.audience, right: rightTraits.audience },
    ];
  }, [left, right]);

  return (
    <PremiumPageShell>
      <Navigation />
      <div className="container mx-auto px-4 py-7 space-y-6">
        <div>
          <h1 className="premium-hero-title text-[46px] font-extrabold leading-[1.05] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
            Comparateur SaaS IA
          </h1>
          <p className="text-white/55 mt-2">Compare rapidement les outils sur les critères business et techniques.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={leftId}
            onChange={(event) => setLeftId(event.target.value)}
            className="rounded-xl border border-white/15 bg-[#0a1224] px-3 py-2 text-white"
          >
            {tools.map((tool) => (
              <option key={tool.id} value={tool.id}>
                {tool.name}
              </option>
            ))}
          </select>
          <select
            value={rightId}
            onChange={(event) => setRightId(event.target.value === leftId ? tools.find((tool) => tool.id !== leftId)?.id ?? event.target.value : event.target.value)}
            className="rounded-xl border border-white/15 bg-[#0a1224] px-3 py-2 text-white"
          >
            {tools.map((tool) => (
              <option key={tool.id} value={tool.id}>
                {tool.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0d0d1a] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/70 border-b border-white/10">
                <th className="p-3 text-left">Critere</th>
                <th className="p-3 text-left">{left?.name ?? 'Tool A'}</th>
                <th className="p-3 text-left">{right?.name ?? 'Tool B'}</th>
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

        <div className="rounded-xl border border-white/10 bg-[#0d0d1a] p-4">
          <h2 className="text-lg font-bold text-white mb-3">Matchups populaires</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
            {matchupLinks.map((matchup) => (
              <Link
                key={matchup.id}
                href={matchup.href}
                className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-xs text-white/80 hover:border-accent hover:text-white"
              >
                {matchup.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PremiumPageShell>
  );
}
