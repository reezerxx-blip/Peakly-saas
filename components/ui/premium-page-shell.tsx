'use client';

import { ParticlesBackground } from '@/components/ui/particles-background';

export function PremiumPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#080810] text-foreground overflow-x-hidden">
      <ParticlesBackground />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 z-0 bg-[radial-gradient(circle_at_top_center,rgba(255,77,0,0.08),transparent_60%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
