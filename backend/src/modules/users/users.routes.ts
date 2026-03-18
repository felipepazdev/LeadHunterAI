import { Router } from 'express';
import { UsersController } from './users.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';

const router = Router();

// Todas as rotas exigem autenticação
router.use(authMiddleware);

// GET  /users/:id         → dados do usuário
router.get('/:id', UsersController.getById);

// GET  /users/:id/leads   → usuário com seus leads
router.get('/:id/leads', UsersController.getWithLeads);

// GET  /users/:id/history → usuário com histórico de buscas
router.get('/:id/history', UsersController.getWithHistory);

// PUT  /users/:id         → atualizar perfil/senha
router.put('/:id', UsersController.update);

// DELETE /users/:id       → excluir conta
router.delete('/:id', UsersController.delete);

export default router;
