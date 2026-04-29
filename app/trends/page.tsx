import { Navigation } from '@/components/navigation';
import { PremiumPageShell } from '@/components/ui/premium-page-shell';
import { TrendsPremium } from '@/components/trends-premium';
import { getRequestLanguage } from '@/lib/i18n-server';
import { getTools } from '@/lib/get-tools';
import { getDataHealth } from '@/lib/data-health';

export const metadata = {
  title: 'Tendances - Peakly',
  description: 'Decouvrez les outils IA en tendance et les signaux en temps reel',
};

export default async function TrendsPage() {
  const lang = await getRequestLanguage();
  const tools = await getTools();
  const health = await getDataHealth();

  return (
    <PremiumPageShell>
      <Navigation />
      <TrendsPremium
        tools={tools}
        lang={lang}
        lastSyncLabel={
          health?.lastSyncAt
            ? `Mis a jour il y a ${Math.max(
                1,
                Math.round((Date.now() - new Date(health.lastSyncAt).getTime()) / (1000 * 60 * 60))
              )}h`
            : 'Mise a jour indisponible'
        }
      />
    </PremiumPageShell>
  );
}
