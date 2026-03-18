/**
 * opportunity-engine.controller.ts
 * Controlador HTTP do módulo Lead Opportunity Engine.
 */

import { Request, Response, NextFunction } from 'express';
import { OpportunityEngineService } from './opportunity-engine.service';
import { AnalyzeLeadsPayload } from './opportunity-engine.types';

export class OpportunityEngineController {

  /**
   * POST /opportunity-engine/analyze
   * Analisa empresas e retorna ranking de oportunidades.
   */
  static async analyze(req: Request, res: Response, next: NextFunction) {
    try {
      const payload: AnalyzeLeadsPayload = {
        keyword:   req.body.keyword,
        city:      req.body.city,
        companies: req.body.companies,
      };

      const ranking = await OpportunityEngineService.analyze(payload);
      const summary = OpportunityEngineService.summarize(ranking);

      res.json({ summary, ranking });
    } catch (err) { next(err); }
  }

  /**
   * POST /opportunity-engine/analyze/single
   * Analisa uma única empresa (útil para analisar um lead já salvo).
   */
  static async analyzeSingle(req: Request, res: Response, next: NextFunction) {
    try {
      const { keyword = 'Busca', city = 'Brasil', company } = req.body;

      if (!company || typeof company !== 'object') {
        res.status(400).json({ message: 'O campo "company" é obrigatório' });
        return;
      }

      const result = await OpportunityEngineService.analyze({
        keyword,
        city,
        companies: [company],
      });

      res.json(result[0] ?? null);
    } catch (err) { next(err); }
  }
}
