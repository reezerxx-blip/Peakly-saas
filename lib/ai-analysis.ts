import type { AppTool } from '@/lib/get-tools';
import type { Language } from '@/lib/i18n-types';

export type ToolAiAnalysis = {
  whyNow: string;
  positioning: string;
  opportunities: string;
  verdict: string;
  gap: string;
  audience: string;
  idea: string;
};

const fallbackByLang: Record<Language, ToolAiAnalysis> = {
  fr: {
    whyNow:
      "L'outil profite d'une traction produit visible sur les usages quotidiens et les integrations. Le signal de croissance reste positif, mais sensible aux cycles de sorties concurrentes.",
    positioning:
      "Positionnement solide sur l'execution et la simplicite d'usage. Faiblesse principale: la differentiation peut se reduire si les concurrents alignent rapidement les fonctionnalites.",
    opportunities:
      "Opportunite pour les indie hackers: proposer des integrations niche, des workflows metier verticaux et une couche analytics orientee ROI pour des cas d'usage specifiques.",
    verdict: "Verdict: dynamique positive, avec une fenetre d'opportunite produit encore ouverte.",
    gap: "Le gap principal semble etre la personnalisation avancee pour des workflows metier tres specifiques.",
    audience:
      "Audience coeur: equipes produit/ops et createurs qui veulent des resultats rapides sans complexite technique.",
    idea:
      "Idee SaaS complementaire: un copilote d'automatisation vertical qui se branche sur les donnees et mesure le ROI par use case.",
  },
  en: {
    whyNow:
      'The tool benefits from visible product traction and ecosystem integrations. Growth signals remain positive but reactive to major competitor launches.',
    positioning:
      'Strong market position on execution and ease of use. Main weakness: differentiation can narrow if competitors quickly replicate core features.',
    opportunities:
      'Indie hacker opportunities include niche integrations, vertical workflows, and an ROI-centric analytics layer for specific segments.',
    verdict: 'Verdict: positive momentum with an open product opportunity window.',
    gap:
      'The biggest gap appears to be advanced customization for highly specific business workflows.',
    audience:
      'Core audience: product/ops teams and creators seeking quick outcomes without heavy technical setup.',
    idea:
      'Complementary SaaS idea: a vertical automation copilot connected to source data with use-case ROI tracking.',
  },
};

function buildHeuristicFallback(tool: AppTool, lang: Language): ToolAiAnalysis {
  const weekly = Number(tool.weeklyGrowth ?? 0);
  const monthly = Number(tool.metrics.monthlyGrowth ?? 0);
  const score = Number(tool.trendingScore ?? 0);
  const status = tool.signalType === 'breakthrough' ? 'hot' : tool.signalType;

  if (lang === 'en') {
    const momentum =
      status === 'hot' || weekly >= 6
        ? 'strong'
        : status === 'rising' || weekly > 1
          ? 'positive'
          : status === 'declining' || weekly < -1
            ? 'negative'
            : 'mixed';
    return {
      whyNow: `${tool.name} shows ${momentum} momentum with weekly growth at ${weekly.toFixed(2)}% and estimated monthly growth at ${monthly.toFixed(2)}%. Current trend score is ${score.toFixed(2)}/100.`,
      positioning: `${tool.name} is positioned in ${tool.category} with a ${tool.pricing ?? 'unknown'} pricing model. Its core strength is execution clarity; risk remains feature parity pressure from adjacent competitors.`,
      opportunities:
        'A practical opportunity is building workflow-specific integrations, reporting overlays, or lightweight automation around repeated user jobs.',
      verdict:
        momentum === 'negative'
          ? 'Verdict: watch closely, traction appears fragile in the current cycle.'
          : 'Verdict: momentum is actionable, with room for focused product plays.',
      gap:
        'Main gap: verticalized workflows and measurable ROI outputs are often still underserved for specific teams.',
      audience:
        'Best audience: product builders, operators, and growth teams needing fast signal-to-action loops.',
      idea:
        'SaaS idea: an insight-to-action assistant that turns trend signals into weekly experiments with outcome tracking.',
    };
  }

  const momentum =
    status === 'hot' || weekly >= 6
      ? 'forte'
      : status === 'rising' || weekly > 1
        ? 'positive'
        : status === 'declining' || weekly < -1
          ? 'negative'
          : 'mitigee';
  return {
    whyNow: `${tool.name} affiche une dynamique ${momentum} avec une croissance hebdo de ${weekly.toFixed(2)}% et une croissance mensuelle estimee a ${monthly.toFixed(2)}%. Le score de tendance actuel est de ${score.toFixed(2)}/100.`,
    positioning: `${tool.name} est positionne sur la categorie ${tool.category} avec un modele ${tool.pricing ?? 'inconnu'}. Sa force principale est l'execution produit; le risque vient d'une concurrence qui peut copier vite.`,
    opportunities:
      "L'opportunite concrete est de construire des integrations metier niche, des couches de reporting ROI et des automatisations sur des taches repetitives.",
    verdict:
      momentum === 'negative'
        ? 'Verdict: traction fragile a surveiller de pres sur les prochaines semaines.'
        : "Verdict: momentum exploitable avec une fenetre d'execution produit ouverte.",
    gap:
      "Gap principal: des workflows verticaux avec des resultats mesurables restent encore sous-servis.",
    audience:
      'Audience cible: builders produit, ops et growth qui veulent transformer les signaux en actions rapides.',
    idea:
      "Idee SaaS: un assistant insight-to-action qui transforme les signaux en experiments hebdo avec suivi d'impact.",
  };
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

export async function generateToolAiAnalysis(tool: AppTool, lang: Language = 'fr'): Promise<ToolAiAnalysis> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return buildHeuristicFallback(tool, lang);

  const system =
    'Tu es un analyste SaaS expert. Analyse cet outil et fournis : 1. Pourquoi il monte ou descend en ce moment (2-3 phrases) 2. Son positionnement marche (forces/faiblesses) 3. Opportunites pour les indie hackers (alternatives, gaps) 4. Verdict final en 1 phrase';
  const userPrompt = `Reponds en JSON strict avec les cles: whyNow, positioning, opportunities, verdict, gap, audience, idea.
Langue: ${lang === 'fr' ? 'francais' : 'english'}.
Outil: ${tool.name}
Categorie: ${tool.category}
Description: ${tool.description}
Trend score: ${Number(tool.trendingScore).toFixed(2)}
Croissance hebdo: ${Number(tool.weeklyGrowth ?? 0).toFixed(2)}%
Croissance mensuelle: ${Number(tool.metrics.monthlyGrowth ?? 0).toFixed(2)}%
Pricing: ${tool.pricing ?? 'unknown'}
Lancement: ${tool.launched ?? 'unknown'}
`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 700,
        system,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      cache: 'no-store',
    });

    if (!response.ok) return buildHeuristicFallback(tool, lang);
    const payload = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = payload.content?.find((c) => c.type === 'text')?.text ?? '';
    const jsonText = extractJsonObject(text);
    if (!jsonText) return buildHeuristicFallback(tool, lang);
    const parsed = JSON.parse(jsonText) as Partial<ToolAiAnalysis>;

    return {
      whyNow: parsed.whyNow ?? fallbackByLang[lang].whyNow,
      positioning: parsed.positioning ?? fallbackByLang[lang].positioning,
      opportunities: parsed.opportunities ?? fallbackByLang[lang].opportunities,
      verdict: parsed.verdict ?? fallbackByLang[lang].verdict,
      gap: parsed.gap ?? fallbackByLang[lang].gap,
      audience: parsed.audience ?? fallbackByLang[lang].audience,
      idea: parsed.idea ?? fallbackByLang[lang].idea,
    };
  } catch {
    return buildHeuristicFallback(tool, lang);
  }
}
