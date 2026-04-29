import { Navigation } from '@/components/navigation';
import { PremiumPageShell } from '@/components/ui/premium-page-shell';

export const metadata = {
  title: 'Terms - Peakly',
  description: 'Terms of service for Peakly',
};

export default function TermsPage() {
  return (
    <PremiumPageShell>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        <h1 className="premium-hero-title text-[44px] font-extrabold leading-[1.05] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
          Terms of Service
        </h1>
        <p className="text-white/70">
          Peakly fournit des signaux et analyses a titre informatif. L utilisateur reste responsable
          de ses decisions business et d investissement.
        </p>
        <p className="text-white/70">
          Les abonnements Pro sont factures mensuellement et peuvent etre annules a tout moment.
        </p>
      </div>
    </PremiumPageShell>
  );
}
