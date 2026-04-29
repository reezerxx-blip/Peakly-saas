import Link from 'next/link';
import { Navigation } from '@/components/navigation';
import { PremiumPageShell } from '@/components/ui/premium-page-shell';

export const metadata = {
  title: 'Getting Started - Peakly',
  description: 'First steps to set up your Peakly workspace',
};

export default function GettingStartedPage() {
  return (
    <PremiumPageShell>
      <Navigation />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="premium-hero-title text-[44px] font-extrabold leading-[1.05] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
          Bien demarrer sur Peakly
        </h1>
        <ol className="mt-6 space-y-4 text-white/80">
          <li>1. Explorez les signaux dans la page Tendances.</li>
          <li>2. Ajoutez 3 outils en favoris depuis votre compte.</li>
          <li>3. Creez votre premiere alerte dans la page Alerts.</li>
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/trends" className="rounded-lg bg-accent px-4 py-2 font-semibold text-accent-foreground">
            Ouvrir Tendances
          </Link>
          <Link href="/account" className="rounded-lg border border-white/20 px-4 py-2 text-white">
            Ouvrir Compte
          </Link>
        </div>
      </div>
    </PremiumPageShell>
  );
}
