import jwt from 'jsonwebtoken';
import { selectOne } from './supabase.js';

const COOKIE = 'nexcore_session';
export const IDLE_TIMEOUT_SECONDS = 15 * 60;

function secret() {
  const value = process.env.JWT_SECRET || process.env.APP_KEY;
  if (!value) throw new Error('Falta JWT_SECRET en las variables de entorno.');
  return value;
}

export function makeSession(user, remember = false) {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign({
    id: user.id,
    email: user.email,
    name: `${user.first_name} ${user.last_name}`.trim(),
    is_admin: Boolean(user.is_admin),
    remember: Boolean(remember),
    idle_expires_at: now + IDLE_TIMEOUT_SECONDS
  }, secret(), { expiresIn: remember ? '30d' : '8h' });
}

export function sessionCookie(token, remember = false) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${remember ? 2592000 : 28800}`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function readToken(req) {
  const cookie = req.headers.cookie || '';
  const found = cookie.split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE}=`));
  return found ? decodeURIComponent(found.slice(COOKIE.length + 1)) : null;
}

export async function requireAdmin(req) {
  const token = readToken(req);
  if (!token) return null;

  try {
    const session = jwt.verify(token, secret());
    if (!session?.is_admin) return null;
    if (!session.idle_expires_at || session.idle_expires_at < Math.floor(Date.now() / 1000)) return null;
    const user = await selectOne('users', { id: session.id }, 'id,first_name,last_name,email,is_admin,correo_verificado,created_at,password');
    if (!user || !user.is_admin || !user.correo_verificado) return null;
    user.__remember = Boolean(session.remember);
    return user;
  } catch {
    return null;
  }
}

export function refreshSessionCookie(user) {
  return sessionCookie(makeSession(user, Boolean(user.__remember)), Boolean(user.__remember));
}

