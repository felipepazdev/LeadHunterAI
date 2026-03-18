/**
 * server.ts — Ponto de entrada da aplicação.
 * Responsabilidade única: inicializar o servidor HTTP.
 */
import { createApp } from './app';
import { env } from './config/env';
import prisma from './database/prisma';

async function bootstrap() {
  const app = createApp();

  const server = app.listen(Number(env.PORT), () => {
    console.log(`\n🚀 LeadHunter AI — Backend iniciado`);
    console.log(`   ➜ http://localhost:${env.PORT}`);
    console.log(`   ➜ Ambiente: ${env.NODE_ENV}\n`);
  });

  // Graceful shutdown — fecha conexões corretamente ao parar o processo
  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] Encerrando servidor...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('✓ Conexões encerradas. Até logo!\n');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

bootstrap().catch(err => {
  console.error('❌ Erro fatal ao inicializar:', err);
  process.exit(1);
});
