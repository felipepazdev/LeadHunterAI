import prisma from '../../database/prisma';
import bcrypt from 'bcryptjs';
import { AppError } from '../../shared/middlewares/errorHandler.middleware';

export interface UpdateUserData {
  name?:     string;
  email?:    string;
  password?: string;
}

const SELECT_PUBLIC = {
  id: true, name: true, email: true, createdAt: true, updatedAt: true,
};

export class UsersService {
  static async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...SELECT_PUBLIC,
        _count: { select: { leads: true, searchHistory: true } },
      },
    });
    if (!user) throw new AppError('Usuário não encontrado', 404);
    return user;
  }

  static async findWithLeads(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...SELECT_PUBLIC,
        leads: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, name: true, phone: true, website: true,
            googleMapsLink: true, address: true, rating: true,
            reviewsCount: true, searchQuery: true, notes: true,
            status: true, userId: true, createdAt: true, updatedAt: true,
          },
        },
      },
    });
    if (!user) throw new AppError('Usuário não encontrado', 404);
    return user;
  }

  static async findWithSearchHistory(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...SELECT_PUBLIC,
        searchHistory: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, keyword: true, city: true, resultsCount: true, createdAt: true },
        },
      },
    });
    if (!user) throw new AppError('Usuário não encontrado', 404);
    return user;
  }

  static async update(id: string, data: UpdateUserData) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new AppError('Usuário não encontrado', 404);

    if (data.email && data.email !== existing.email) {
      const taken = await prisma.user.findUnique({ where: { email: data.email } });
      if (taken) throw new AppError('E-mail já está em uso por outro usuário', 409);
    }

    const updates: Record<string, unknown> = {};
    if (data.name)     updates.name     = data.name;
    if (data.email)    updates.email    = data.email;
    if (data.password) updates.password = await bcrypt.hash(data.password, 10);

    const updated = await prisma.user.update({
      where: { id },
      data: updates,
      select: SELECT_PUBLIC,
    });
    return updated;
  }

  static async delete(id: string) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new AppError('Usuário não encontrado', 404);

    // Cascade manual (garante mesmo sem onDelete: Cascade no DB)
    await prisma.$transaction([
      prisma.searchHistory.deleteMany({ where: { userId: id } }),
      prisma.lead.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return { message: 'Conta removida com sucesso' };
  }
}
