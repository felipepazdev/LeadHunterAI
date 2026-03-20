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
    company: RawCompany,
  ): AIEvaluation {
    let potential: AIPotential;
    let reasoning: string;

    const ratingInfo = company.rating ? `${company.rating}⭐ (${company.reviewsCount} av.)` : 'sem avaliação';

    if (score.total >= 70) {
      potential = 'ALTO_POTENCIAL';
      reasoning = `Score ${score.total}/100 — empresa tem budget de marketing, mas presença digital fraca. Recomenda-se corrigir as ${opportunities.length} oportunidade(s) detectadas. Melhorar a reputação atual (${ratingInfo}) no Google ajudará significativamente no SEO local e no aumento de conversões.`;
    } else if (score.total >= 40) {
      potential = 'MÉDIO_POTENCIAL';
      reasoning = `Score ${score.total}/100 — potencial moderado com ${opportunities.length} oportunidade(s). Uma abordagem consultiva focada na infraestrutura do site e no SEO local (atualmente ${ratingInfo}) é recomendada para alavancar a atração de clientes orgânicos.`;
    } else {
      potential = 'BAIXO_POTENCIAL';
      reasoning = `Score ${score.total}/100 — empresa possui perfil de baixo investimento ou infraestrutura digital já consolidada. A avaliação (${ratingInfo}) indica que ações pontuais de SEO e conversão podem oferecer ganhos residuais.`;
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
Você é um especialista em marketing digital e SEO, focado em prospecção de vendas B2B.
Analise o perfil digital desta empresa e classifique o seu potencial como cliente, detalhando profundamente o que pode ser melhorado.

EMPRESA: ${company.name}
AVALIAÇÃO GOOGLE (reputação local): ${company.rating ?? 'Sem avaliação'} ⭐ (${company.reviewsCount ?? 0} reviews)
WEBSITE: ${company.website ?? 'Não possui'}
ANÚNCIO GOOGLE: ${adResult.marketingActive ? `Sim (posição ${adResult.adPosition})` : 'Não detectado'}
QUALIDADE DO SITE (1-10): ${siteAnalysis.hasWebsite ? siteAnalysis.digitalScore : 'N/A — sem site'}
TEMPO DE CARREGAMENTO: ${siteAnalysis.loadTimeMs ? `${(siteAnalysis.loadTimeMs / 1000).toFixed(1)}s` : 'N/A'}
VERSÃO MOBILE: ${siteAnalysis.hasMobileVersion ? 'Sim' : 'Não'}
FORMULÁRIO DE CONTATO: ${siteAnalysis.hasContactForm ? 'Sim' : 'Não'}
OPORTUNIDADES DETECTADAS: ${opportunities.map(o => o.label).join(', ') || 'Nenhuma'}
SCORE DE OPORTUNIDADE: ${score.total}/100

INSTRUÇÕES:
Sua avaliação deve conter uma análise detalhada (business intelligence) focada em conversão, tempo de carregamento e experiência do usuário (UX).
INCLUA, OBRIGATORIAMENTE, uma análise específica de SEO Local baseada no rank/avaliação do Google da empresa, e como melhorar a reputação online deles para captar lead orgânico.

Responda EXATAMENTE neste formato JSON (sem markdown, sem \`\`\`):
{
  "potential": "ALTO_POTENCIAL" | "MÉDIO_POTENCIAL" | "BAIXO_POTENCIAL",
  "reasoning": "Texto explicativo (básico de 3 a 5 frases) rico em detalhes destacando o score total, o impacto em SEO / tempo de carregamento e a situação da avaliação do Google Meu Negócio / rank no Google."
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
      return this.fallbackEvaluate(score, opportunities, company);
    }
  }
}
