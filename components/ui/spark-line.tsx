'use client';

export function SparkLine({
  data,
  color = '#00ccff',
  width = 60,
  height = 20,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const round = (value: number) => Number(value.toFixed(3));

  if (!data.length) return <svg width={width} height={height} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const normalized = data.map((v, i) => {
    const x = round((i / Math.max(1, data.length - 1)) * width);
    const y = round(max === min ? height / 2 : height - ((v - min) / (max - min)) * height);
    return [x, y] as const;
  });
  const d = normalized.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
