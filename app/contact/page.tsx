import { Navigation } from '@/components/navigation';
import { PremiumPageShell } from '@/components/ui/premium-page-shell';

export const metadata = {
  title: 'Contact - Peakly',
  description: 'Get in touch with Peakly',
};

export default function ContactPage() {
  return (
    <PremiumPageShell>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="premium-hero-title text-[44px] font-extrabold leading-[1.05] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
          Contact
        </h1>
        <p className="mt-2 text-white/60">
          Une question produit, facturation ou partenariat ? Ecrivez-nous a{' '}
          <a className="text-accent underline" href="mailto:hello@peakly.app">
            hello@peakly.app
          </a>
          .
        </p>
      </div>
    </PremiumPageShell>
  );
}
