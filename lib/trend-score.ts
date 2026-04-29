export type TrendStatus = 'hot' | 'rising' | 'stable' | 'declining';
export type DataQuality = 'high' | 'medium' | 'low';

export interface TrendInputTool {
  googleTrendsGrowth?: number;
  mentionsScore?: number;
  productHuntUpvotes?: number;
  githubStarsGrowth?: number;
  youtubeSignal?: number;
  devtoSignal?: number;
}

export interface TrendScoreResult {
  score: number;
  trendStatus: TrendStatus;
  dataQuality: DataQuality;
  growthPct: number;
}

const WEIGHTS = {
  googleTrendsGrowth: 0.25,
  mentionsScore: 0.2,
  productHuntUpvotes: 0.15,
  githubStarsGrowth: 0.15,
  youtubeSignal: 0.15,
  devtoSignal: 0.1,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

function getQuality(availableSources: number): DataQuality {
  if (availableSources >= 6) return 'high';
  if (availableSources >= 4) return 'medium';
  return 'low';
}

export function getTrendStatus(score: number, previousScore: number): TrendStatus {
  const growthPct = previousScore > 0 ? ((score - previousScore) / previousScore) * 100 : 0;
  if (score > 75) return 'hot';
  if (score >= 50 && score <= 75 && growthPct > 0) return 'rising';
  if (score >= 30 && score < 50) return 'stable';
  return 'declining';
}

export function calculateTrendScore(
  tool: TrendInputTool,
  previousScore = 0
): TrendScoreResult {
  const normalizedBySource: Partial<Record<keyof typeof WEIGHTS, number>> = {};

  if (typeof tool.googleTrendsGrowth === 'number') {
    normalizedBySource.googleTrendsGrowth = normalize(tool.googleTrendsGrowth, -50, 120);
  }
  if (typeof tool.mentionsScore === 'number') {
    normalizedBySource.mentionsScore = normalize(tool.mentionsScore, 0, 200);
  }
  if (typeof tool.productHuntUpvotes === 'number') {
    normalizedBySource.productHuntUpvotes = normalize(tool.productHuntUpvotes, 0, 5000);
  }
  if (typeof tool.githubStarsGrowth === 'number') {
    normalizedBySource.githubStarsGrowth = normalize(tool.githubStarsGrowth, -30, 80);
  }
  if (typeof tool.youtubeSignal === 'number') {
    normalizedBySource.youtubeSignal = normalize(tool.youtubeSignal, 0, 300);
  }
  if (typeof tool.devtoSignal === 'number') {
    normalizedBySource.devtoSignal = normalize(tool.devtoSignal, 0, 200);
  }

  const availableKeys = Object.keys(normalizedBySource) as Array<keyof typeof WEIGHTS>;
  const availableWeight = availableKeys.reduce((sum, key) => sum + WEIGHTS[key], 0);

  let score = previousScore;
  if (availableWeight > 0) {
    score = availableKeys.reduce((sum, key) => {
      const redistributedWeight = WEIGHTS[key] / availableWeight;
      return sum + (normalizedBySource[key] ?? 0) * redistributedWeight;
    }, 0);
  }

  const safeScore = Math.round(clamp(score, 0, 100) * 10) / 10;
  const growthPct = previousScore > 0 ? ((safeScore - previousScore) / previousScore) * 100 : 0;

  return {
    score: safeScore,
    trendStatus: getTrendStatus(safeScore, previousScore),
    dataQuality: getQuality(availableKeys.length),
    growthPct: Math.round(growthPct * 100) / 100,
  };
}

export const trendScoreExamples = [
  {
    name: 'All Sources - High Quality',
    input: {
      googleTrendsGrowth: 42,
      mentionsScore: 120,
      productHuntUpvotes: 2800,
      githubStarsGrowth: 18,
      youtubeSignal: 140,
      devtoSignal: 80,
    },
    previousScore: 61.5,
  },
  {
    name: 'Partial Sources - Medium Quality',
    input: {
      googleTrendsGrowth: 12,
      mentionsScore: 52,
      githubStarsGrowth: 8,
      youtubeSignal: 45,
    },
    previousScore: 44,
  },
  {
    name: 'Low Signals - Low Quality',
    input: {
      mentionsScore: 10,
      devtoSignal: 4,
    },
    previousScore: 28,
  },
].map((example) => ({
  ...example,
  result: calculateTrendScore(example.input, example.previousScore),
}));
