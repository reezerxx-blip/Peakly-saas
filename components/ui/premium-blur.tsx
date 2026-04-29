import Link from 'next/link';

export function PremiumBlur({
  locked,
  children,
  ctaHref = '/alerts',
}: {
  locked: boolean;
  children: React.ReactNode;
  ctaHref?: string;
}) {
  if (!locked) return <>{children}</>;
  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="blur-[4px] pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 grid place-items-center bg-black/45">
        <div className="text-center space-y-3">
          <span className="inline-flex px-2.5 py-1 rounded-full text-xs bg-[#ffaa0020] border border-[#ffaa00] text-[#ffaa00]">
            Premium
          </span>
          <div>
            <Link href={ctaHref} className="px-3 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold">
              Debloquer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
