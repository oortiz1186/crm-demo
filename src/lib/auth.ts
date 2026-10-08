import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { db } from './db';
import type { Role } from '@prisma/client';
const secret = () => { const value = process.env.SESSION_SECRET; if (!value || value.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters'); return new TextEncoder().encode(value); };
export async function sessionUser() {
  const token = (await cookies()).get('mida_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: 'mida-crm', audience: 'mida-crm' });
    if (typeof payload.sub !== 'string') return null;
    return await db.user.findFirst({ where: { id: payload.sub, active: true }, select: { id: true, name: true, role: true, email: true } });
  } catch { return null; }
}
export async function signInCookie(userId: string) {
  const token = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(userId).setIssuer('mida-crm').setAudience('mida-crm').setIssuedAt().setExpirationTime('8h').sign(secret());
  (await cookies()).set('mida_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 8*3600 });
}
export const canManage = (role: Role, ownerId: string, actorId: string) => role === 'ADMIN' || role === 'COORDINACION' || ownerId === actorId;
export const canAssign = (role: Role) => role === 'ADMIN' || role === 'COORDINACION';
