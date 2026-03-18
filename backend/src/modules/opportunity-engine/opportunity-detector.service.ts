/**
 * opportunity-detector.service.ts
 * Aplica regras de negócio para identificar oportunidades de venda
 * baseadas no perfil digital da empresa.
 */

import {
  AdDetectionResult,
  DetectedOpportunity,
  OpportunityType,
  RawCompany,
  WebsiteAnalysis,
} from './opportunity-engine.types';

const OPPORTUNITY_LABELS: Record<OpportunityType, { label: string; description: string }> = {
  SLOW_SITE_WITH_ADS: {
    label: 'Site lento + Anúncios ativos',
    description: 'Empresa investe em tráfego pago mas perde conversões por lentidão no site.',
  },
  HIGH_RATING_WEAK_SITE: {
    label: 'Boa reputação, site fraco',
    description: 'Empresa tem avaliação excelente no Google mas site não converte leads.',
  },
  NO_CONTACT_FORM: {
    label: 'Sem formulário de contato',
    description: 'Site não captura leads de forma automatizada. Oportunidade de CRO.',
  },
  NO_LANDING_PAGE: {
    label: 'Sem landing page',
    description: 'Empresa não tem página focada em conversão para campanhas de tráfego.',
  },
  NO_WEBSITE: {
    label: 'Sem website',
    description: 'Empresa não possui presença digital própria. Alta oportunidade de criação de site.',
  },
  NO_DIGITAL_PRESENCE: {
    label: 'Presença digital mínima',
    description: 'Empresa não anuncia e tem site fraco ou inexistente.',
  },
};

export class OpportunityDetectorService {
  static detect(
    company: RawCompany,
    adResult: AdDetectionResult,
    siteAnalysis: WebsiteAnalysis,
  ): DetectedOpportunity[] {
    const opportunities: DetectedOpportunity[] = [];

    const push = (type: OpportunityType) =>
      opportunities.push({ type, ...OPPORTUNITY_LABELS[type] });

    // Regra 1: Sem website
    if (!siteAnalysis.hasWebsite) {
      push('NO_WEBSITE');
    }

    // Regra 2: Site lento + anúncios ativos
    if (
      siteAnalysis.hasWebsite &&
      adResult.marketingActive &&
      (siteAnalysis.loadTimeMs ?? 0) > 3500
    ) {
      push('SLOW_SITE_WITH_ADS');
    }

    // Regra 3: Alta avaliação + site fraco (digital score < 5)
    if (
      (company.rating ?? 0) >= 4.2 &&
      siteAnalysis.hasWebsite &&
      siteAnalysis.digitalScore < 5
    ) {
      push('HIGH_RATING_WEAK_SITE');
    }

    // Regra 4: Sem formulário de contato
    if (siteAnalysis.hasWebsite && !siteAnalysis.hasContactForm) {
      push('NO_CONTACT_FORM');
    }

    // Regra 5: Sem landing page
    if (siteAnalysis.hasWebsite && !siteAnalysis.hasLandingPage) {
      push('NO_LANDING_PAGE');
    }

    // Regra 6: Nenhuma presença digital relevante
    if (!adResult.marketingActive && siteAnalysis.digitalScore <= 3) {
      push('NO_DIGITAL_PRESENCE');
    }

    return opportunities;
  }
}
