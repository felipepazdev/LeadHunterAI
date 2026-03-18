import { Request, Response, NextFunction } from 'express';

/**
 * Classe de erro HTTP com status code.
 * Lançar este erro nas services garante respostas corretas ao cliente.
 *
 * @example
 * throw new AppError('Usuário não encontrado', 404);
 */
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Middleware global de tratamento de erros.
 * Deve ser registrado APÓS todas as rotas no app.ts.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  // Erros esperados (regra de negócio)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Erro do Prisma: violação de constraint única (ex: e-mail duplicado)
  if ((err as { code?: string }).code === 'P2002') {
    return res.status(409).json({ message: 'Registro duplicado' });
  }

  // Erro do Prisma: registro não encontrado
  if ((err as { code?: string }).code === 'P2025') {
    return res.status(404).json({ message: 'Registro não encontrado' });
  }

  // Erros inesperados — logamos e retornamos mensagem genérica
  console.error('[ERRO NÃO TRATADO]', err);
  return res.status(500).json({ message: 'Erro interno do servidor' });
}
