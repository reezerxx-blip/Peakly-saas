import { Navigation } from '@/components/navigation';
import { PremiumPageShell } from '@/components/ui/premium-page-shell';

export const metadata = {
  title: 'Privacy - Peakly',
  description: 'Privacy policy for Peakly',
};

export default function PrivacyPage() {
  return (
    <PremiumPageShell>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        <h1 className="premium-hero-title text-[44px] font-extrabold leading-[1.05] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        <p className="text-white/70">
          Nous collectons uniquement les donnees necessaires au fonctionnement du service (compte,
          preferences, favoris, alertes). Nous ne revendons pas vos donnees personnelles.
        </p>
        <p className="text-white/70">
          Pour exercer vos droits de suppression ou d acces, contactez hello@peakly.app.
        </p>
      </div>
    </PremiumPageShell>
  );
}
