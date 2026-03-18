import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(result);
    } catch (err) { next(err); }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.json(result);
    } catch (err) { next(err); }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.findById(req.userId!);
      res.json({ user });
    } catch (err) { next(err); }
  }
}
