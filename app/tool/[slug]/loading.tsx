import { Navigation } from '@/components/navigation';

export default function ToolDetailLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="h-6 w-40 rounded bg-white/10 animate-pulse" />
        <div className="rounded-2xl border border-white/10 bg-[#12121e] p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,320px] gap-6">
            <div className="space-y-4">
              <div className="h-8 w-64 rounded bg-white/10 animate-pulse" />
              <div className="h-4 w-full rounded bg-white/10 animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-white/10 animate-pulse" />
            </div>
            <div className="h-52 rounded-xl bg-white/5 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-white/10 bg-[#12121e] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
