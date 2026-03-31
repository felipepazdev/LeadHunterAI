/**
 * ad-detector.service.ts
 * Detecta se a empresa aparece como anúncio patrocinado no Google.
 *
 * PRODUÇÃO: substituir a simulação por chamada real à SerpAPI
 * ou scraping com Playwright para detectar slots "Anúncio" na SERP.
 */

import { AdDetectionResult, RawCompany } from './opportunity-engine.types';

export class AdDetectorService {
  /**
   * Analisa se a empresa está rodando anúncios pagos no Google.
   * A lógica de simulação usa heurísticas realistas:
   *  - Empresas com avaliação alta (>= 4) e muitas reviews tendem a investir em ads.
   *  - Introduz aleatoriedade para parecer dados reais.
   */
  static async detect(company: RawCompany): Promise<AdDetectionResult> {
    // Se a empresa possui a tag confirmada da API (ex: SerpApi)
    if (company.isSponsored !== undefined) {
      return {
        marketingActive: company.isSponsored,
        adPosition: company.isSponsored ? 1 : undefined
      };
    }

    // ── Heurística de simulação realista (fallback caso não tenha a flag) ──────────────────────────
    const ratingFactor   = (company.rating ?? 0) >= 4.0 ? 0.55 : 0.30;
    const reviewFactor   = (company.reviewsCount ?? 0) >= 50 ? 0.20 : 0.05;
    const websiteFactor  = company.website ? 0.15 : 0;
    const randomFactor   = Math.random() * 0.20;

    const adProbability  = ratingFactor + reviewFactor + websiteFactor + randomFactor;
    const marketingActive = adProbability >= 0.70;

    const adPosition = marketingActive
      ? Math.floor(Math.random() * 3) + 1   // posições 1, 2 ou 3
      : undefined;

    return { marketingActive, adPosition };
  }
}
