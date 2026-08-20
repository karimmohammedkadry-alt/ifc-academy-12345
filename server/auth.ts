import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { AdminUser } from '../src/types';
import { getSupabase } from './supabase';

function secret(name: 'JWT_SECRET' | 'SESSION_SECRET') {
  const value = process.env[name];
  if (!value || value.length < 32) throw new Error(`${name} must be configured with at least 32 characters`);
  return value;
}

export function hashPassword(password: string): string { return bcrypt.hashSync(password, 12); }

export function verifyPassword(plainPassword: string, password?: string | null, passwordHash?: string | null): boolean {
  if (!plainPassword) return false;
  if (passwordHash) {
    if (/^\$2[aby]\$/.test(passwordHash)) {
      try { return bcrypt.compareSync(plainPassword, passwordHash); } catch { return false; }
    }
    if (passwordHash.startsWith('scrypt:')) {
      try {
        const [params, salt, expected] = passwordHash.split('$');
        const [, n, r, p] = params.split(':');
        const derived = crypto.scryptSync(plainPassword, salt, expected.length / 2, {
          N: Number(n) || 32768, r: Number(r) || 8, p: Number(p) || 1, maxmem: 128 * 1024 * 1024
        });
        return crypto.timingSafeEqual(Buffer.from(derived.toString('hex'), 'utf8'), Buffer.from(expected, 'utf8'));
      } catch { return false; }
    }
  }
  // Backward-compatible with the existing production design where password is populated.
  // A successful plaintext login is immediately migrated to bcrypt by the login endpoint.
  return Boolean(password && plainPassword === password);
}

export interface TokenPayload { userId: string; username: string; role: string; exp: number; }

function sign(payloadB64: string) {
  return crypto.createHmac('sha256', secret('JWT_SECRET')).update(payloadB64).digest('base64url');
}

export function generateToken(user: AdminUser): string {
  const payload: TokenPayload = { userId: user.id, username: user.username, role: user.role, exp: Date.now() + 8 * 60 * 60 * 1000 };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const [body, signature] = token.split('.');
    if (!body || !signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(sign(body)))) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as TokenPayload;
    if (!payload.userId || payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

export function setSession(res: Response, token: string) {
  const signature = crypto.createHmac('sha256', secret('SESSION_SECRET')).update(token).digest('base64url');
  res.cookie('ifc_session', `${token}.${signature}`, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000, path: '/'
  });
}

export function clearSession(res: Response) { res.clearCookie('ifc_session', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' }); }

function tokenFromRequest(req: Request) {
  const cookie = req.cookies?.ifc_session as string | undefined;
  if (cookie) {
    const dot = cookie.lastIndexOf('.');
    if (dot > 0) {
      const token = cookie.slice(0, dot); const sig = cookie.slice(dot + 1);
      const expected = crypto.createHmac('sha256', secret('SESSION_SECRET')).update(token).digest('base64url');
      if (sig === expected) return token;
    }
  }
  const auth = req.headers.authorization;
  return auth?.startsWith('Bearer ') ? auth.slice(7) : null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = tokenFromRequest(req);
    const payload = token ? verifyToken(token) : null;
    if (!payload) return res.status(401).json({ error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى' });
    (req as any).user = payload;
    next();
  } catch (e: any) { return res.status(503).json({ error: e.message || 'خدمة المصادقة غير متاحة' }); }
}

const attempts = new Map<string, { count: number; until: number }>();
export function checkLoginRateLimit(identifier: string) {
  const r = attempts.get(identifier.toLowerCase());
  if (!r || r.until < Date.now()) return { allowed: true };
  return { allowed: false, remainingMinutes: Math.ceil((r.until - Date.now()) / 60000) };
}
export function recordFailedLogin(identifier: string) {
  const key = identifier.toLowerCase(); const r = attempts.get(key) || { count: 0, until: 0 }; r.count++;
  if (r.count >= 5) r.until = Date.now() + 15 * 60 * 1000;
  attempts.set(key, r);
  return { locked: r.count >= 5, remainingMinutes: 15 };
}
export function resetLoginAttempts(identifier: string) { attempts.delete(identifier.toLowerCase()); }

export async function getAuthenticatedUser(userId: string): Promise<AdminUser | null> {
  const supabase = getSupabase(); if (!supabase) return null;
  const { data, error } = await supabase.from('users').select('id,username,role').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  return { id: data.id, username: data.username, name: data.username, email: '', role: data.role };
}
