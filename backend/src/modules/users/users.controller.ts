import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { AppError } from '../../shared/middlewares/errorHandler.middleware';

function assertOwner(req: Request, targetId: string) {
  if (req.userId !== targetId) {
    throw new AppError('Acesso negado', 403);
  }
}

export class UsersController {
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      assertOwner(req, req.params.id);
      const user = await UsersService.findById(req.params.id);
      res.json({ user });
    } catch (err) { next(err); }
  }

  static async getWithLeads(req: Request, res: Response, next: NextFunction) {
    try {
      assertOwner(req, req.params.id);
      const user = await UsersService.findWithLeads(req.params.id);
      res.json({ user });
    } catch (err) { next(err); }
  }

  static async getWithHistory(req: Request, res: Response, next: NextFunction) {
    try {
      assertOwner(req, req.params.id);
      const user = await UsersService.findWithSearchHistory(req.params.id);
      res.json({ user });
    } catch (err) { next(err); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      assertOwner(req, req.params.id);
      const user = await UsersService.update(req.params.id, req.body);
      res.json({ user, message: 'Perfil atualizado com sucesso' });
    } catch (err) { next(err); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      assertOwner(req, req.params.id);
      const result = await UsersService.delete(req.params.id);
      res.json(result);
    } catch (err) { next(err); }
  }
}
