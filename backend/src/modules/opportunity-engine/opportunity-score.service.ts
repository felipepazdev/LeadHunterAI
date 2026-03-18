/**
 * opportunity-score.service.ts
 * Calcula o score de oportunidade de 0 a 100 baseado em 3 eixos:
 *  - Presença em anúncios (0-40 pts)
 *  - Qualidade do site     (0-30 pts)
 *  - Avaliação / rating    (0-30 pts)
 */

import {
  AdDetectionResult,
  OpportunityScore,
  RawCompany,
  WebsiteAnalysis,
} from './opportunity-engine.types';

export class OpportunityScoreService {
  static calculate(
    company: RawCompany,
    adResult: AdDetectionResult,
    siteAnalysis: WebsiteAnalysis,
  ): OpportunityScore {
    /* ── Anúncios (0-40) ───────────────────────────────────────────
     * Se a empresa anuncia, ela tem budget de marketing → oportunidade real.
     * Posição 1 = 40pts | Posição 2 = 35pts | Posição 3+ = 30pts | Sem ad = 0
     */
    let adsScore = 0;
    if (adResult.marketingActive) {
      const position = adResult.adPosition ?? 3;
      if (position === 1)      adsScore = 40;
      else if (position === 2) adsScore = 35;
      else                     adsScore = 30;
    }

    /* ── Site (0-30) ──────────────────────────────────────────────
     * Invertemos o digital score: site RUIM = mais oportunidade de venda.
     * digitalScore 1 = 30pts (máxima oportunidade)
     * digitalScore 10 = 0pts (empresa já tem site bom)
     * Sem site = 30pts máximo
     */
    let siteScore = 0;
    if (!siteAnalysis.hasWebsite) {
      siteScore = 30;
    } else {
      const invertedScore = 10 - siteAnalysis.digitalScore; // 0-9
      siteScore = Math.round((invertedScore / 9) * 30);
    }

    /* ── Rating (0-30) ────────────────────────────────────────────
     * Rating alto = empresa estabelecida e com clientes → tem budget.
     * 5.0 = 30pts | 4.0 = 24pts | 3.0 = 18pts | sem rating = 10pts
     */
    let ratingScore = 10; // default se sem rating
    if (company.rating != null) {
      ratingScore = Math.round((company.rating / 5) * 30);
    }

    const total = Math.min(100, adsScore + siteScore + ratingScore);

    return {
      total,
      breakdown: { adsScore, siteScore, ratingScore },
    };
  }
}
