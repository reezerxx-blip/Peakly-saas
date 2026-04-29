import { cn } from '@/lib/utils';

export function ScoreBar({ score, animated = true, delayMs = 0 }: { score: number; animated?: boolean; delayMs?: number }) {
  const safe = Math.max(0, Math.min(100, Number(score) || 0));
  const color = safe > 60 ? '#00ff88' : safe >= 40 ? '#ffaa00' : '#ff4466';
  return (
    <div className="h-[3px] rounded bg-white/5 overflow-hidden relative">
      <div
        className={cn('h-full rounded relative', animated && 'transition-all duration-1000 ease-out')}
        style={{
          width: `${safe}%`,
          backgroundColor: color,
          transitionDelay: `${delayMs}ms`,
        }}
      >
        {animated && <span className="absolute top-0 left-0 h-full w-1/3 premium-score-shine" />}
      </div>
    </div>
  );
}
