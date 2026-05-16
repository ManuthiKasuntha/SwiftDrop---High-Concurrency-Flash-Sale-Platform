import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { blacklistedTokens } from '../controllers/auth.controller';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_123';

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid token format' });
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted in memory (for logout)
    if (blacklistedTokens.has(token)) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Token has been invalidated' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden', message: 'Requires admin privileges' });
  }
  next();
};
