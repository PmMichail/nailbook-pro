import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Немає доступу. Токен відсутній.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Недійсний токен авторизації' });
  }
};

export const requireMaster = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'MASTER') {
    return res.status(403).json({ error: 'Доступ заборонено. Потрібні права майстра.' });
  }
  next();
};

export const requireClient = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'CLIENT') {
    return res.status(403).json({ error: 'Доступ заборонено.' });
  }
  next();
};
