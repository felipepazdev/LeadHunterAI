import { Router } from 'express';
import { LeadsController } from './leads.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

// Busca de leads (Scraper)
router.post('/search',         LeadsController.search);
router.post('/search-history', LeadsController.saveSearchHistory);

// CRUD de leads
router.get('/',          LeadsController.list);
router.get('/:id',       LeadsController.getById);
router.post('/',         LeadsController.create);
router.put('/:id',       LeadsController.update);
router.put('/:id/status', LeadsController.updateStatus);
router.delete('/:id',    LeadsController.delete);
router.delete('/',       LeadsController.deleteMany);

export default router;
