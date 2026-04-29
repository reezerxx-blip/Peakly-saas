import { BubbleMap } from '@/components/bubble-map';
import { Navigation } from '@/components/navigation';
import { NewsFeed } from '@/components/news-feed';
import { PremiumPageShell } from '@/components/ui/premium-page-shell';
import { LiveIndicator } from '@/components/ui/live-indicator';
import { CountUp } from '@/components/ui/count-up';
import { getRequestLanguage } from '@/lib/i18n-server';
import { getTools } from '@/lib/get-tools';
import { getDataHealth } from '@/lib/data-health';

export const metadata = {
  title: 'Vue Bulles - Peakly',
  description: 'Carte interactive des tendances IA',
};

export default async function BubblesPage() {
  const lang = await getRequestLanguage();
  const tools = await getTools();
  const health = await getDataHealth();
  const hot = tools.filter((t) => t.signalType === 'breakthrough').length;
  const rising = tools.filter((t) => t.signalType === 'rising').length;
  const declining = tools.filter((t) => t.signalType === 'declining').length;

  return (
    <PremiumPageShell>
      <Navigation />
      <div className="container mx-auto px-4 py-7 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="premium-hero-title text-[52px] font-extrabold leading-[1.04] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
              Bubble Map
            </h1>
            <p className="premium-subtitle text-white/50 text-base">
              {lang === 'fr' ? 'Visualisez le marche en temps reel' : 'Visualize the market in real time'}
            </p>
            <p className="text-xs text-white/45 mt-2">
              <span className="inline-flex items-center gap-1 mr-3"><span className="w-2 h-2 rounded-full bg-[#00ff88]" />Hot</span>
              <span className="inline-flex items-center gap-1 mr-3"><span className="w-2 h-2 rounded-full bg-[#00ccff]" />Rising</span>
              <span className="inline-flex items-center gap-1 mr-3"><span className="w-2 h-2 rounded-full bg-white/50" />Stable</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ff4466]" />Declining</span>
            </p>
          </div>
          <LiveIndicator />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-[#00ff8820] bg-[#00ff8808] p-3 text-[#00ff88]"><CountUp value={hot} /> outils hot</div>
          <div className="rounded-xl border border-[#00ccff20] bg-[#00ccff08] p-3 text-[#00ccff]"><CountUp value={rising} /> en progression</div>
          <div className="rounded-xl border border-[#ff446620] bg-[#ff446608] p-3 text-[#ff4466]"><CountUp value={declining} /> en declin</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[720px]">
          <div className="lg:col-span-2">
            <div className="h-full bg-[#0a0a14] rounded-[20px] border border-white/10 p-4">
              <BubbleMap lang={lang} tools={tools} dataHealth={health} />
            </div>
          </div>
          <div className="lg:col-span-1 h-full overflow-auto">
            <NewsFeed lang={lang} />
          </div>
        </div>
      </div>
    </PremiumPageShell>
  );
}
