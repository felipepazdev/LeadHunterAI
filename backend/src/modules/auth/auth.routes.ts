import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';

const router = Router();

// POST /auth/register → criar conta
router.post('/register', AuthController.register);

// POST /auth/login → autenticar
router.post('/login', AuthController.login);

// GET /auth/me → dados do usuário logado
router.get('/me', authMiddleware, AuthController.me);

export default router;
