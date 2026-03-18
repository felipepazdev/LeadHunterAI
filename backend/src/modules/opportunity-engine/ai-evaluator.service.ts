/**
 * ai-evaluator.service.ts
 * Usa o Google Gemini para classificar o potencial de cada lead.
 *
 * Fallback automático: se GEMINI_API_KEY não estiver configurada,
 * usa heurística local para não bloquear o sistema.
 */

import {
  AdDetectionResult,
  AIEvaluation,
  AIPotential,
  DetectedOpportunity,
  OpportunityScore,
  RawCompany,
  WebsiteAnalysis,
} from './opportunity-engine.types';

export class AIEvaluatorService {
  /* ── Helper: chama Gemini via REST ───────────────────────────── */
  private static async callGemini(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 300,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error: ${err}`);
    }

    const data = await res.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };

    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  /* ── Fallback heurístico (sem API key) ───────────────────────── */
  private static fallbackEvaluate(
    score: OpportunityScore,
    opportunities: DetectedOpportunity[],
  ): AIEvaluation {
    let potential: AIPotential;
    let reasoning: string;

    if (score.total >= 70) {
      potential = 'ALTO_POTENCIAL';
      reasoning = `Score ${score.total}/100 — empresa tem budget de marketing e presença digital fraca. ${opportunities.length} oportunidade(s) identificada(s).`;
    } else if (score.total >= 40) {
      potential = 'MÉDIO_POTENCIAL';
      reasoning = `Score ${score.total}/100 — empresa tem potencial moderado com ${opportunities.length} oportunidade(s). Abordagem consultiva recomendada.`;
    } else {
      potential = 'BAIXO_POTENCIAL';
      reasoning = `Score ${score.total}/100 — empresa possui presença digital razoável ou perfil de baixo investimento em marketing.`;
    }

    return { potential, reasoning };
  }

  /* ── Avaliação principal ─────────────────────────────────────── */
  static async evaluate(
    company: RawCompany,
    adResult: AdDetectionResult,
    siteAnalysis: WebsiteAnalysis,
    opportunities: DetectedOpportunity[],
    score: OpportunityScore,
  ): Promise<AIEvaluation> {

    // Tenta Gemini primeiro
    try {
      const prompt = `
Você é um especialista em prospecção de serviços digitais.
Analise o perfil desta empresa e classifique o potencial de venda:

EMPRESA: ${company.name}
AVALIAÇÃO GOOGLE: ${company.rating ?? 'Sem avaliação'} ⭐ (${company.reviewsCount ?? 0} reviews)
WEBSITE: ${company.website ?? 'Não possui'}
ANÚNCIO GOOGLE: ${adResult.marketingActive ? `Sim (posição ${adResult.adPosition})` : 'Não detectado'}
QUALIDADE DO SITE (1-10): ${siteAnalysis.hasWebsite ? siteAnalysis.digitalScore : 'N/A — sem site'}
TEMPO DE CARREGAMENTO: ${siteAnalysis.loadTimeMs ? `${(siteAnalysis.loadTimeMs / 1000).toFixed(1)}s` : 'N/A'}
VERSÃO MOBILE: ${siteAnalysis.hasMobileVersion ? 'Sim' : 'Não'}
FORMULÁRIO DE CONTATO: ${siteAnalysis.hasContactForm ? 'Sim' : 'Não'}
OPORTUNIDADES DETECTADAS: ${opportunities.map(o => o.label).join(', ') || 'Nenhuma'}
SCORE DE OPORTUNIDADE: ${score.total}/100

Responda EXATAMENTE neste formato JSON (sem markdown, sem \`\`\`):
{
  "potential": "ALTO_POTENCIAL" | "MÉDIO_POTENCIAL" | "BAIXO_POTENCIAL",
  "reasoning": "Explicação em 1-2 frases em português"
}
`.trim();

      const raw = await this.callGemini(prompt);

      // Extrai JSON da resposta
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Resposta Gemini inválida');

      const parsed = JSON.parse(match[0]) as { potential: AIPotential; reasoning: string };

      // Valida o campo potential
      const validPotentials: AIPotential[] = ['ALTO_POTENCIAL', 'MÉDIO_POTENCIAL', 'BAIXO_POTENCIAL'];
      if (!validPotentials.includes(parsed.potential)) {
        throw new Error('Potential inválido retornado pelo Gemini');
      }

      return { potential: parsed.potential, reasoning: parsed.reasoning };

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[AIEvaluator] Gemini indisponível, usando fallback. Motivo: ${msg}`);
      return this.fallbackEvaluate(score, opportunities);
    }
  }
}
