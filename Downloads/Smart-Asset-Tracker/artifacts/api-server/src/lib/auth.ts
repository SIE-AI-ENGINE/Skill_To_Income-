import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";

// Tell express-session what we store in `req.session`.
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const SALT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Blocks the request unless a valid session cookie is present.
 * Attaches nothing extra to `req` — route handlers read `req.session.userId`.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}
