/**
 * opportunity-engine.service.ts
 * Orquestrador principal do módulo Lead Opportunity Engine.
 * Pipeline: Collector → AdDetector → SiteAnalyzer → OpportunityDetector
 *           → OpportunityScore → AIEvaluator → MessageGenerator → Rank
 */

import { AppError } from '../../shared/middlewares/errorHandler.middleware';
import { AdDetectorService }          from './ad-detector.service';
import { AIEvaluatorService }         from './ai-evaluator.service';
import { LeadCollectorService }       from './lead-collector.service';
import { MessageGeneratorService }    from './message-generator.service';
import { OpportunityDetectorService } from './opportunity-detector.service';
import { OpportunityScoreService }    from './opportunity-score.service';
import { SiteAnalyzerService }        from './site-analyzer.service';
import {
  AnalyzeLeadsPayload,
  LeadRankEntry,
  RawCompany,
} from './opportunity-engine.types';

export class OpportunityEngineService {

  /**
   * Analisa uma lista de empresas e retorna o ranking de oportunidades.
   * Processa cada empresa em paralelo para máxima performance.
   */
  static async analyze(payload: AnalyzeLeadsPayload): Promise<LeadRankEntry[]> {
    const { keyword, city, companies: inputCompanies } = payload;

    if (!keyword?.trim() || !city?.trim()) {
      throw new AppError('Os campos "keyword" e "city" são obrigatórios', 400);
    }

    // 1. Coleta empresas (usa as fornecidas ou coleta via SerpApi)
    const companies: RawCompany[] = inputCompanies?.length
      ? inputCompanies
      : await LeadCollectorService.collect(keyword.trim(), city.trim(), true);

    if (companies.length === 0) {
      throw new AppError('Não encontramos empresas anunciantes nesta região no momento.', 404);
    }

    // 2. Processa cada empresa no pipeline completo (paralelo)
    const allEntries: LeadRankEntry[] = await Promise.all(
      companies.map(company => this.processCompany(company))
    );

    // 3. Filtro rígido: Mostrar APENAS quem é de fato um anúncio patrocinado
    const entries = allEntries.filter(e => e.adDetection.marketingActive);

    if (entries.length === 0) {
      throw new AppError('Nenhuma dessas empresas possui anúncios ativos no Google no momento.', 404);
    }

    // 4. Ordena pelo score de oportunidade (maior primeiro)
    entries.sort((a, b) => b.opportunityScore.total - a.opportunityScore.total);

    return entries;
  }

  /**
   * Processa uma única empresa através de todo o pipeline de análise.
   */
  private static async processCompany(company: RawCompany): Promise<LeadRankEntry> {
    // Etapas 1 e 2: Detecção de anúncio + análise de site (paralelas)
    const [adDetection, websiteAnalysis] = await Promise.all([
      AdDetectorService.detect(company),
      SiteAnalyzerService.analyze(company),
    ]);

    // Etapa 3: Detectar oportunidades (síncrono, baseado em regras)
    const opportunities = OpportunityDetectorService.detect(
      company, adDetection, websiteAnalysis
    );

    // Etapa 4: Calcular score de oportunidade (síncrono)
    const opportunityScore = OpportunityScoreService.calculate(
      company, adDetection, websiteAnalysis
    );

    // Etapa 5: Avaliação IA (async — pode chamar Gemini)
    const aiEvaluation = await AIEvaluatorService.evaluate(
      company, adDetection, websiteAnalysis, opportunities, opportunityScore
    );

    // Etapa 6: Gerar mensagem personalizada (síncrono)
    const prospectMessage = MessageGeneratorService.generate(
      company, adDetection, websiteAnalysis, opportunities
    );

    return {
      company,
      adDetection,
      websiteAnalysis,
      opportunities,
      aiEvaluation,
      opportunityScore,
      prospectMessage,
    };
  }

  /**
   * Retorna um resumo agregado do ranking para dashboard.
   */
  static summarize(entries: LeadRankEntry[]) {
    const total = entries.length;
    const highPotential   = entries.filter(e => e.aiEvaluation.potential === 'ALTO_POTENCIAL').length;
    const mediumPotential = entries.filter(e => e.aiEvaluation.potential === 'MÉDIO_POTENCIAL').length;
    const lowPotential    = entries.filter(e => e.aiEvaluation.potential === 'BAIXO_POTENCIAL').length;
    const withAds         = entries.filter(e => e.adDetection.marketingActive).length;
    const withoutWebsite  = entries.filter(e => !e.websiteAnalysis.hasWebsite).length;
    const avgScore        = total > 0
      ? Math.round(entries.reduce((acc, e) => acc + e.opportunityScore.total, 0) / total)
      : 0;

    return {
      total,
      highPotential,
      mediumPotential,
      lowPotential,
      withAds,
      withoutWebsite,
      avgScore,
    };
  }
}
