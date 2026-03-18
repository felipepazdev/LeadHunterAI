/**
 * Configuração centralizada de variáveis de ambiente.
 * Valida variáveis obrigatórias na inicialização do servidor.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Variável de ambiente obrigatória não definida: ${key}`);
  }
  return value;
}

export const env = {
  // Servidor
  PORT:     process.env.PORT || '3001',
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Banco de dados
  DATABASE_URL: requireEnv('DATABASE_URL'),

  // Autenticação
  JWT_SECRET:     process.env.JWT_SECRET || 'leadhunter-dev-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Flags
  isDev:  (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
};
