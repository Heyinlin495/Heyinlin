// JWT authentication middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDB } from '../db';
import { JWTPayload, PublicUser } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
      userId?: string;
    }
  }
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'fallback-secret';

  try {
    const payload = jwt.verify(token, secret) as JWTPayload;
    req.userId = payload.sub;

    // Load user from DB and attach to request
    const db = getDB();
    const user = db.prepare(
      `SELECT id, username, display_name, avatar_url, bio, role_type,
              website, location, is_verified, is_private, theme, created_at
       FROM users WHERE id = ? AND is_deleted = 0`
    ).get(payload.sub) as PublicUser | undefined;

    if (!user) {
      res.status(401).json({ success: false, error: 'User not found or deleted' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Token expired' });
      return;
    }
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

// Optional auth — attaches user if token present, but doesn't block
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'fallback-secret';

  try {
    const payload = jwt.verify(token, secret) as JWTPayload;
    req.userId = payload.sub;

    const db = getDB();
    req.user = db.prepare(
      `SELECT id, username, display_name, avatar_url, bio, role_type,
              website, location, is_verified, is_private, theme, created_at
       FROM users WHERE id = ? AND is_deleted = 0`
    ).get(payload.sub) as PublicUser | undefined;
  } catch {
    // Token invalid — continue without user
  }

  next();
}

// Rate limiter for auth endpoints
import rateLimit from 'express-rate-limit';
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 attempts per window
  message: { success: false, error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
