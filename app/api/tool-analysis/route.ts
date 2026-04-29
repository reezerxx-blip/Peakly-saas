import { NextResponse } from 'next/server';
import type { Language } from '@/lib/i18n-types';
import type { AppTool } from '@/lib/get-tools';
import { generateToolAiAnalysis } from '@/lib/ai-analysis';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { tool?: AppTool; lang?: Language };
    if (!body.tool) {
      return NextResponse.json({ error: 'tool is required' }, { status: 400 });
    }

    const lang: Language = body.lang === 'en' ? 'en' : 'fr';
    const analysis = await generateToolAiAnalysis(body.tool, lang);
    return NextResponse.json({ analysis });
  } catch {
    return NextResponse.json({ error: 'Unable to generate analysis' }, { status: 500 });
  }
}
