import Link from 'next/link';
import { Navigation } from '@/components/navigation';
import { PremiumPageShell } from '@/components/ui/premium-page-shell';

export const metadata = {
  title: 'Pricing - Peakly',
  description: 'Compare Peakly plans',
};

export default function PricingPage() {
  return (
    <PremiumPageShell>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="premium-hero-title text-[44px] font-extrabold leading-[1.05] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
          Pricing
        </h1>
        <p className="mt-2 text-white/60">Choisissez le plan adapte a votre rythme.</p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#0d0d1a] p-6">
            <h2 className="text-2xl font-bold">Free</h2>
            <p className="mt-2 text-white/60">Ideal pour decouvrir le produit.</p>
            <p className="mt-4 text-3xl font-extrabold">0EUR/mois</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>- Tendances et categories</li>
              <li>- Acces aux pages outils</li>
              <li>- Vue Bulles</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[#ffaa00]/60 bg-[#0d0d1a] p-6 shadow-[0_0_28px_rgba(255,170,0,0.18)]">
            <h2 className="text-2xl font-bold">Pro</h2>
            <p className="mt-2 text-white/60">Pour les builders qui surveillent des signaux forts.</p>
            <p className="mt-4 text-3xl font-extrabold">9EUR/mois</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>- Alertes personnalisees</li>
              <li>- Filtres avances</li>
              <li>- Priorite support</li>
            </ul>
            <Link
              href="/alerts"
              className="mt-6 inline-flex rounded-lg bg-accent px-4 py-2 font-semibold text-accent-foreground"
            >
              Passer Pro
            </Link>
          </div>
        </div>
      </div>
    </PremiumPageShell>
  );
}
