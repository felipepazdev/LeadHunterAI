/**
 * app.ts — Instância do Express configurada.
 * Separada do server.ts para facilitar testes (importa sem iniciar o servidor).
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './shared/middlewares/errorHandler.middleware';

// Módulos
import authRoutes  from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import leadsRoutes from './modules/leads/leads.routes';

export function createApp() {
  const app = express();

  /* ── Middlewares globais ── */
  app.use(cors({
    origin:  env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  /* ── Health check ── */
  app.get('/', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'LeadHunter AI API',
      version: '1.0.0',
      env: env.NODE_ENV,
    });
  });

  /* ── Rotas dos módulos ── */
  app.use('/auth',  authRoutes);
  app.use('/users', usersRoutes);
  app.use('/leads', leadsRoutes);

  /* ── 404 handler ── */
  app.use((_req, res) => {
    res.status(404).json({ message: 'Rota não encontrada' });
  });

  /* ── Error handler global (DEVE ser o último middleware) ── */
  app.use(errorHandler);

  return app;
}
