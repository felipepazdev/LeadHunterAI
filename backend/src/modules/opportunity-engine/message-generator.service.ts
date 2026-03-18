/**
 * message-generator.service.ts
 * Gera mensagem personalizada de prospecção para cada empresa.
 * A mensagem referencia especificamente as oportunidades detectadas,
 * tornando a abordagem relevante e não genérica.
 */

import {
  AdDetectionResult,
  DetectedOpportunity,
  ProspectMessage,
  RawCompany,
  WebsiteAnalysis,
} from './opportunity-engine.types';

export class MessageGeneratorService {
  static generate(
    company: RawCompany,
    adResult: AdDetectionResult,
    siteAnalysis: WebsiteAnalysis,
    opportunities: DetectedOpportunity[],
  ): ProspectMessage {
    const hasOpps = opportunities.length > 0;

    // ── Abertura ──────────────────────────────────────────────────
    const openings = [
      `Olá! Encontrei a ${company.name} no Google`,
      `Oi! Vi a ${company.name} em uma pesquisa recente`,
      `Olá, tudo bem? Encontrei a ${company.name} enquanto pesquisava no Google`,
    ];
    const opening = openings[Math.floor(Math.random() * openings.length)];

    // ── Gancho baseado no contexto ────────────────────────────────
    let hook = '';

    if (!siteAnalysis.hasWebsite) {
      hook = ' e percebi que vocês ainda não possuem um site próprio.';
    } else if (adResult.marketingActive && (siteAnalysis.loadTimeMs ?? 0) > 3500) {
      hook = ` e vi que vocês estão investindo em anúncios — ótima estratégia! Porém notei que o site pode estar lento (${(( siteAnalysis.loadTimeMs ?? 0) / 1000).toFixed(1)}s), o que pode estar reduzindo as conversões.`;
    } else if (adResult.marketingActive && !siteAnalysis.hasMobileVersion) {
      hook = ' e notei que vocês anunciam no Google. Percebi, porém, que o site não tem uma versão otimizada para celular, o que pode estar fazendo os clientes abandonarem a página.';
    } else if (adResult.marketingActive && !siteAnalysis.hasContactForm) {
      hook = ' e vi que investem em anúncios. Notei que o site não tem um formulário de captura de leads, o que pode fazer vocês perderem contatos valiosos.';
    } else if ((company.rating ?? 0) >= 4.2 && siteAnalysis.digitalScore < 5) {
      hook = ` e fiquei impressionado com a avaliação de ${company.rating}⭐ de vocês! Porém, o site ainda tem espaço para melhorar e converter mais clientes.`;
    } else if (!siteAnalysis.hasLandingPage) {
      hook = ' e vi que vocês ainda não têm uma landing page dedicada para capturar leads das suas campanhas.';
    } else if (hasOpps) {
      hook = ` e identifiquei ${opportunities.length} oportunidade(s) para vocês melhorarem a presença digital e atrair mais clientes.`;
    } else {
      hook = ' e gostaria de apresentar como podemos ajudar a potencializar ainda mais seus resultados digitais.';
    }

    // ── CTA ───────────────────────────────────────────────────────
    const ctas = [
      ' Posso te mostrar uma análise rápida e gratuita?',
      ' Posso compartilhar um diagnóstico completo sem compromisso?',
      ' Que tal uma conversa de 15 minutos para eu mostrar o que identificamos?',
    ];
    const cta = ctas[Math.floor(Math.random() * ctas.length)];

    return { text: opening + hook + cta };
  }
}
