import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { body, json, method } from './_lib/http.js';
import { remove, selectOne, update } from './_lib/supabase.js';
import { validatePassword } from './_lib/password.js';

export default async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  try {
    const data = await body(req);
    const token = String(data.token || '');
    const password = String(data.password || '');
    const confirmation = String(data.password_confirmation || '');
    const errors = validatePassword(password);
    if (errors.length) return json(res, 422, { ok: false, message: errors.join(' ') });
    if (password !== confirmation) return json(res, 422, { ok: false, message: 'Las contraseñas no coinciden.' });
    const reset = await selectOne('password_resets', { token_hash: crypto.createHash('sha256').update(token).digest('hex') }, 'id,user_id,expires_at');
    if (!reset || new Date(reset.expires_at).getTime() < Date.now()) return json(res, 400, { ok: false, message: 'El enlace no es válido o ya caducó.' });
    await update('users', { id: reset.user_id }, { password: await bcrypt.hash(password, 12) });
    await remove('password_resets', { user_id: reset.user_id });
    await remove('remember_tokens', { user_id: reset.user_id });
    return json(res, 200, { ok: true, message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    return json(res, error.statusCode || 500, { ok: false, message: error.message });
  }
}


