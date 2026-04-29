import { cn } from '@/lib/utils';

export function TrendBadge({ status }: { status: 'hot' | 'rising' | 'stable' | 'declining' }) {
  const styles =
    status === 'hot'
      ? 'bg-[#00ff8815] border-[#00ff8840] text-[#00ff88]'
      : status === 'rising'
        ? 'bg-[#00ccff15] border-[#00ccff40] text-[#00ccff]'
        : status === 'declining'
          ? 'bg-[#ff446615] border-[#ff446640] text-[#ff4466]'
          : 'bg-white/5 border-white/20 text-white/50';

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs', styles)}>
      {status === 'hot' && <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] premium-dot-pulse" />}
      {status === 'rising' && <span className="premium-arrow-up">↑</span>}
      {status === 'declining' && <span>↓</span>}
      {status}
    </span>
  );
}
