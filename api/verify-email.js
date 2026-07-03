import crypto from 'crypto';
import { json, method } from './_lib/http.js';
import { selectOne, update } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (!method(req, res, ['GET'])) return;
  try {
    const token = new URL(req.url, `https://${req.headers.host}`).searchParams.get('token') || '';
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await selectOne('users', { email_verification_token: hash }, 'id,correo_verificado');
    if (!user || user.correo_verificado) return json(res, 400, { ok: false, message: 'El enlace no es válido o ya fue usado.' });
    await update('users', { id: user.id }, { correo_verificado: true, email_verified_at: new Date().toISOString(), email_verification_token: null });
    return json(res, 200, { ok: true, message: 'Correo verificado correctamente. Ahora puedes iniciar sesión.' });
  } catch (error) {
    return json(res, error.statusCode || 500, { ok: false, message: error.message });
  }
}


