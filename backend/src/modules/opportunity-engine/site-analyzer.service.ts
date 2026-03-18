/**
 * site-analyzer.service.ts
 * Analisa a presença digital da empresa (site, mobile, formulário, velocidade).
 *
 * PRODUÇÃO: substituir simulação por:
 *  - Google PageSpeed Insights API para load time real
 *  - Puppeteer/Playwright para verificar formulário e mobile
 */

import { WebsiteAnalysis, RawCompany } from './opportunity-engine.types';

export class SiteAnalyzerService {
  static async analyze(company: RawCompany): Promise<WebsiteAnalysis> {
    if (!company.website) {
      return {
        hasWebsite: false,
        digitalScore: 1,
      };
    }

    // ── Simulação realista de métricas ────────────────────────────
    const loadTimeMs      = Math.floor(Math.random() * 7000) + 800; // 800ms - 7.8s
    const hasMobileVersion = Math.random() > 0.35;   // 65% têm versão mobile
    const hasContactForm   = Math.random() > 0.45;   // 55% têm formulário
    const hasLandingPage   = Math.random() > 0.55;   // 45% têm landing page

    // ── Calcula digital score (1-10) ──────────────────────────────
    let score = 5; // baseline por ter site

    // Load time penaliza: > 4s = -2, 2-4s = -1, < 2s = +2
    if (loadTimeMs < 2000)       score += 2;
    else if (loadTimeMs <= 4000) score -= 1;
    else                         score -= 2;

    if (hasMobileVersion) score += 1;
    if (hasContactForm)   score += 1;
    if (hasLandingPage)   score += 1;

    // Garante limites 1-10
    const digitalScore = Math.max(1, Math.min(10, score));

    return {
      hasWebsite: true,
      loadTimeMs,
      hasMobileVersion,
      hasContactForm,
      hasLandingPage,
      digitalScore,
    };
  }
}
