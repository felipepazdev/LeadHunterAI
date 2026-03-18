/**
 * opportunity-engine.routes.ts
 * Rotas do módulo Lead Opportunity Engine.
 * Todas as rotas são protegidas por autenticação JWT.
 */

import { Router } from 'express';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { OpportunityEngineController } from './opportunity-engine.controller';

const router = Router();

// Todas as rotas exigem JWT
router.use(authMiddleware);

/**
 * POST /opportunity-engine/analyze
 * Body: { keyword: string, city: string, companies?: RawCompany[] }
 * Analisa múltiplas empresas e retorna ranking de oportunidades
 */
router.post('/analyze', OpportunityEngineController.analyze);

/**
 * POST /opportunity-engine/analyze/single
 * Body: { company: RawCompany, keyword?: string, city?: string }
 * Analisa uma única empresa individualmente
 */
router.post('/analyze/single', OpportunityEngineController.analyzeSingle);

export default router;
