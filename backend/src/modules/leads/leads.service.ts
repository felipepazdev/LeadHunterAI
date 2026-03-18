import { Status } from '@prisma/client';
import prisma from '../../database/prisma';
import { AppError } from '../../shared/middlewares/errorHandler.middleware';

/* ─── tipos ─────────────────────────────────── */
export interface CreateLeadData {
  name: string; phone?: string; website?: string;
  googleMapsLink?: string; address?: string;
  rating?: number; reviewsCount?: number;
  searchQuery?: string; notes?: string;
}
export interface UpdateLeadData extends Partial<CreateLeadData> {
  status?: Status;
}
export interface ListLeadsQuery {
  status?: Status; search?: string; page?: number; limit?: number;
}

/* ─── helpers ───────────────────────────────── */
function assertValidStatus(status: unknown): asserts status is Status {
  if (!status || !Object.values(Status).includes(status as Status)) {
    throw new AppError(
      `Status inválido. Valores aceitos: ${Object.values(Status).join(', ')}`, 400
    );
  }
}

async function assertOwnership(leadId: string, userId: string) {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, userId } });
  if (!lead) throw new AppError('Lead não encontrado ou sem permissão', 404);
  return lead;
}

/* ─── service ───────────────────────────────── */
export class LeadsService {

  static async list(userId: string, query: ListLeadsQuery) {
    const { status, search, page = 1, limit = 50 } = query;
    const where: Record<string, unknown> = { userId };
    if (status) { assertValidStatus(status); where.status = status; }
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return { leads, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  static async findById(leadId: string, userId: string) {
    return assertOwnership(leadId, userId);
  }

  static async create(userId: string, data: CreateLeadData) {
    if (!data.name?.trim()) throw new AppError('O campo "name" é obrigatório', 400);
    return prisma.lead.create({
      data: {
        name:           data.name.trim(),
        phone:          data.phone?.trim()         || null,
        website:        data.website?.trim()       || null,
        googleMapsLink: data.googleMapsLink?.trim()|| null,
        address:        data.address?.trim()       || null,
        rating:         data.rating  != null ? Number(data.rating)  : null,
        reviewsCount:   data.reviewsCount != null ? Number(data.reviewsCount) : null,
        searchQuery:    data.searchQuery?.trim()   || null,
        notes:          data.notes?.trim()         || null,
        userId,
      },
    });
  }

  static async update(leadId: string, userId: string, data: UpdateLeadData) {
    await assertOwnership(leadId, userId);
    if (data.status) assertValidStatus(data.status);

    const patch: Record<string, unknown> = {};
    if (data.name          !== undefined) patch.name          = data.name?.trim();
    if (data.phone         !== undefined) patch.phone         = data.phone?.trim()         || null;
    if (data.website       !== undefined) patch.website       = data.website?.trim()       || null;
    if (data.googleMapsLink!== undefined) patch.googleMapsLink= data.googleMapsLink?.trim()|| null;
    if (data.address       !== undefined) patch.address       = data.address?.trim()       || null;
    if (data.rating        !== undefined) patch.rating        = Number(data.rating);
    if (data.reviewsCount  !== undefined) patch.reviewsCount  = Number(data.reviewsCount);
    if (data.searchQuery   !== undefined) patch.searchQuery   = data.searchQuery?.trim()   || null;
    if (data.notes         !== undefined) patch.notes         = data.notes?.trim()         || null;
    if (data.status        !== undefined) patch.status        = data.status;

    return prisma.lead.update({ where: { id: leadId }, data: patch });
  }

  static async updateStatus(leadId: string, userId: string, status: Status) {
    assertValidStatus(status);
    await assertOwnership(leadId, userId);
    return prisma.lead.update({ where: { id: leadId }, data: { status } });
  }

  static async delete(leadId: string, userId: string) {
    await assertOwnership(leadId, userId);
    await prisma.lead.delete({ where: { id: leadId } });
    return { message: 'Lead removido com sucesso' };
  }

  static async deleteMany(ids: string[], userId: string) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('Envie um array "ids" com os IDs a remover', 400);
    }
    const result = await prisma.lead.deleteMany({
      where: { id: { in: ids }, userId },
    });
    return { message: `${result.count} lead(s) removido(s)` };
  }

  /* ── Search ────────────────────────────────── */
  static async search(userId: string, keyword: string, city: string) {
    if (!keyword?.trim() || !city?.trim()) {
      throw new AppError('Keyword e cidade são obrigatórias para pesquisar', 400);
    }

    // Simulação de busca (Mock de Scraper)
    const results = Array.from({ length: 8 }, (_, i) => ({
      name:           `${keyword.trim()} — ${city.trim()} #${i + 1}`,
      phone:          `(11) 9${Math.floor(Math.random() * 90000000 + 10000000)}`,
      website:        i % 3 !== 0 ? `https://empresa${i + 1}.com.br` : null,
      googleMapsLink: `https://maps.google.com/?q=${encodeURIComponent(keyword + ' ' + city)}`,
      rating:         parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
      reviewsCount:   Math.floor(Math.random() * 800 + 10),
      address:        `Rua Exemplo, ${100 + i} — ${city.trim()}`,
    }));

    // Registra no histórico
    await this.saveSearchHistory(userId, keyword, city, results.length);

    return results;
  }

  /* ── Search History ──────────────────────── */
  static async saveSearchHistory(userId: string, keyword: string, city: string, resultsCount = 0) {
    if (!keyword || !city) throw new AppError('"keyword" e "city" são obrigatórios', 400);
    return prisma.searchHistory.create({
      data: {
        keyword: keyword.trim(),
        city: city.trim(),
        resultsCount: Number(resultsCount),
        userId,
      },
    });
  }
}
