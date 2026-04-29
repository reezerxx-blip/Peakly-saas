type DiscoveryTool = {
  id: string;
  name: string;
  category: string;
  description: string;
  website?: string;
  tags?: string[];
  pricing?: string;
  monthlyVisits?: number;
  githubRepo?: string;
};

export type PopularityBand = 'all' | 'mega' | 'high' | 'medium' | 'low';

export type ToolTraits = {
  hasApi: boolean;
  openSource: boolean;
  noCode: boolean;
  selfHosted: boolean;
  audience: 'b2b' | 'b2c' | 'hybrid';
  aiType: 'llm' | 'image' | 'automation' | 'analytics' | 'workflow';
  popularity: Exclude<PopularityBand, 'all'>;
  integrations: string[];
  useCases: string[];
};

function containsAny(value: string, terms: string[]): boolean {
  const lower = value.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

export function inferToolTraits(tool: DiscoveryTool): ToolTraits {
  const corpus = `${tool.name} ${tool.description} ${(tool.tags ?? []).join(' ')}`.toLowerCase();
  const hasApi = Boolean(tool.githubRepo) || containsAny(corpus, ['api', 'sdk', 'webhook', 'developer']);
  const openSource = containsAny(corpus, ['open-source', 'open source', 'oss', 'github']);
  const noCode = containsAny(corpus, ['no-code', 'nocode', 'visual builder', 'drag']);
  const selfHosted = containsAny(corpus, ['self-hosted', 'self hosted', 'on-prem', 'on premise']);
  const audience =
    containsAny(corpus, ['enterprise', 'b2b', 'team', 'workflow', 'sales']) ? 'b2b' : containsAny(corpus, ['creator', 'consumer', 'personal']) ? 'b2c' : 'hybrid';
  const aiType = containsAny(corpus, ['image', 'video', 'creative', 'design'])
    ? 'image'
    : containsAny(corpus, ['analytics', 'insight', 'metrics', 'tracking'])
      ? 'analytics'
      : containsAny(corpus, ['automation', 'workflow', 'integrations'])
        ? 'automation'
        : containsAny(corpus, ['productivity', 'project', 'support'])
          ? 'workflow'
          : 'llm';

  const monthlyVisits = Number(tool.monthlyVisits ?? 0);
  const popularity = monthlyVisits >= 100_000_000 ? 'mega' : monthlyVisits >= 20_000_000 ? 'high' : monthlyVisits >= 5_000_000 ? 'medium' : 'low';

  const integrations = [
    hasApi ? 'api' : null,
    containsAny(corpus, ['zapier']) ? 'zapier' : null,
    containsAny(corpus, ['slack']) ? 'slack' : null,
    containsAny(corpus, ['notion']) ? 'notion' : null,
    containsAny(corpus, ['hubspot']) ? 'hubspot' : null,
  ].filter(Boolean) as string[];

  const useCases = [
    containsAny(corpus, ['support', 'helpdesk', 'ticket']) ? 'support client' : null,
    containsAny(corpus, ['content', 'copy', 'writing']) ? 'creation de contenu' : null,
    containsAny(corpus, ['developer', 'code', 'sdk']) ? 'dev productivity' : null,
    containsAny(corpus, ['analytics', 'insight']) ? 'market analytics' : null,
    containsAny(corpus, ['design', 'image', 'video']) ? 'creative production' : null,
  ].filter(Boolean) as string[];

  return {
    hasApi,
    openSource,
    noCode,
    selfHosted,
    audience,
    aiType,
    popularity,
    integrations,
    useCases,
  };
}

const synonyms: Record<string, string[]> = {
  'support client': ['service client', 'helpdesk', 'support'],
  seo: ['referencement', 'search', 'keywords'],
  automate: ['automation', 'workflow', 'integrations'],
  image: ['design', 'visual', 'creative'],
  ecriture: ['copywriting', 'writing', 'content'],
};

export function matchesDiscoveryQuery(tool: DiscoveryTool, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const traits = inferToolTraits(tool);
  const corpus = [
    tool.name,
    tool.category,
    tool.description,
    tool.website ?? '',
    (tool.tags ?? []).join(' '),
    traits.aiType,
    traits.audience,
    traits.useCases.join(' '),
    traits.integrations.join(' '),
  ]
    .join(' ')
    .toLowerCase();

  if (corpus.includes(q)) return true;
  const related = synonyms[q] ?? [];
  return related.some((term) => corpus.includes(term));
}

export function discoveryAutocomplete(tools: DiscoveryTool[], query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const pool = new Set<string>();
  for (const tool of tools) {
    pool.add(tool.name);
    pool.add(tool.category);
    for (const tag of tool.tags ?? []) pool.add(tag);
    for (const useCase of inferToolTraits(tool).useCases) pool.add(useCase);
  }
  return Array.from(pool)
    .filter((value) => value.toLowerCase().includes(q))
    .slice(0, 8);
}
