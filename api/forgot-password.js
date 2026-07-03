import crypto from 'crypto';
import { body, json, method, publicUrl } from './_lib/http.js';
import { insert, remove, selectOne } from './_lib/supabase.js';
import { sendPasswordResetEmail } from './_lib/mail.js';

export default async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  try {
    const data = await body(req);
    const email = String(data.email || '').trim().toLowerCase();
    const generic = 'Si el correo existe y está verificado, recibirás un enlace para restablecer tu contraseña.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 422, { ok: false, message: 'Ingresa un correo válido.' });
    const user = await selectOne('users', { email }, 'id,first_name,last_name,email,correo_verificado');
    if (!user || !user.correo_verificado) return json(res, 200, { ok: true, message: generic });
    const token = crypto.randomBytes(32).toString('hex');
    await remove('password_resets', { user_id: user.id });
    await insert('password_resets', { user_id: user.id, token_hash: crypto.createHash('sha256').update(token).digest('hex'), expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() });
    const link = `${publicUrl(req)}/reset_password.html?token=${encodeURIComponent(token)}`;
    try {
      const delivery = await sendPasswordResetEmail(user.email, `${user.first_name} ${user.last_name}`, link);
      return json(res, 200, { ok: true, message: delivery.mode === 'debug' ? 'Configura SMTP en Vercel para enviar correos.' : generic, debugLink: delivery.mode === 'debug' ? link : undefined });
    } catch (error) {
      await remove('password_resets', { user_id: user.id });
      return json(res, 500, { ok: false, message: 'No se pudo enviar el correo de recuperación.' });
    }
  } catch (error) {
    return json(res, error.statusCode || 500, { ok: false, message: error.message });
  }
}


