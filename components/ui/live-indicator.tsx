export function LiveIndicator() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-400/30 bg-red-500/10 text-red-300 text-xs">
      <span className="w-2 h-2 rounded-full bg-red-500 premium-live-pulse" />
      Live
    </div>
  );
}
