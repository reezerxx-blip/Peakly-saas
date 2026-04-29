import { describe, expect, it } from 'vitest';
import { calculateTrendScore, getTrendStatus } from '../lib/trend-score';

describe('trend score', () => {
  it('computes a bounded score and quality from available signals', () => {
    const result = calculateTrendScore({
      googleTrendsGrowth: 42,
      mentionsScore: 120,
      productHuntUpvotes: 2800,
      githubStarsGrowth: 18,
      youtubeSignal: 140,
      devtoSignal: 80,
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.dataQuality).toBe('high');
  });

  it('falls back to previous score when no signals are available', () => {
    const result = calculateTrendScore({}, 37.3);
    expect(result.score).toBe(37.3);
    expect(result.dataQuality).toBe('low');
  });

  it('classifies trend status deterministically', () => {
    expect(getTrendStatus(80, 60)).toBe('hot');
    expect(getTrendStatus(60, 55)).toBe('rising');
    expect(getTrendStatus(40, 40)).toBe('stable');
    expect(getTrendStatus(10, 20)).toBe('declining');
  });
});
