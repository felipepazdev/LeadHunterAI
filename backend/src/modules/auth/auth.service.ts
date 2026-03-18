import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import prisma from '../../database/prisma';
import { AppError } from '../../shared/middlewares/errorHandler.middleware';

export interface RegisterData { name: string; email: string; password: string; }
export interface LoginData    { email: string; password: string; }

export class AuthService {
  /* ── Register ─────────────────────────────── */
  static async register(data: RegisterData) {
    const { name, email, password } = data;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new AppError('E-mail já está em uso', 409);

    const hashed = await bcrypt.hash(password, 10);
    const user   = await prisma.user.create({
      data: { name, email, password: hashed },
    });

    return { user: this.sanitize(user), token: this.sign(user.id) };
  }

  /* ── Login ────────────────────────────────── */
  static async login(data: LoginData) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('Credenciais inválidas', 401);

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new AppError('Credenciais inválidas', 401);

    return { user: this.sanitize(user), token: this.sign(user.id) };
  }

  /* ── Me ───────────────────────────────────── */
  static async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!user) throw new AppError('Usuário não encontrado', 404);
    return user;
  }

  /* ── Helpers ──────────────────────────────── */
  private static sign(userId: string) {
    return jwt.sign({ id: userId }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }

  private static sanitize(user: { id: string; name: string; email: string }) {
    return { id: user.id, name: user.name, email: user.email };
  }
}
