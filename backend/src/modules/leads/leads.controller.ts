import { Request, Response, NextFunction } from 'express';
import { LeadsService } from './leads.service';
import { Status } from '@prisma/client';

export class LeadsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search, page, limit } = req.query;
      const result = await LeadsService.list(req.userId!, {
        status:  status  as Status | undefined,
        search:  search  as string | undefined,
        page:    page  ? Number(page)  : undefined,
        limit:   limit ? Number(limit) : undefined,
      });
      res.json(result);
    } catch (err) { next(err); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const lead = await LeadsService.findById(req.params.id, req.userId!);
      res.json(lead);
    } catch (err) { next(err); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const lead = await LeadsService.create(req.userId!, req.body);
      res.status(201).json(lead);
    } catch (err) { next(err); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const lead = await LeadsService.update(req.params.id, req.userId!, req.body);
      res.json(lead);
    } catch (err) { next(err); }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const lead = await LeadsService.updateStatus(req.params.id, req.userId!, req.body.status);
      res.json(lead);
    } catch (err) { next(err); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await LeadsService.delete(req.params.id, req.userId!);
      res.json(result);
    } catch (err) { next(err); }
  }

  static async deleteMany(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await LeadsService.deleteMany(req.body.ids, req.userId!);
      res.json(result);
    } catch (err) { next(err); }
  }

  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { keyword, city } = req.body;
      const results = await LeadsService.search(req.userId!, keyword, city);
      res.json(results);
    } catch (err) { next(err); }
  }

  static async saveSearchHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { keyword, city, resultsCount } = req.body;
      const history = await LeadsService.saveSearchHistory(req.userId!, keyword, city, resultsCount);
      res.status(201).json(history);
    } catch (err) { next(err); }
  }
}
