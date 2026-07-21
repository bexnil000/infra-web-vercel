import { json, method } from './_lib/http.js';
import { refreshSessionCookie, requireUser } from './_lib/auth.js';
import { update } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (!method(req, res, ['GET'])) return;

  const user = await requireUser(req);
  if (!user) {
    return json(res, 401, { ok: false, message: 'Tu sesión expiró. Inicia sesión nuevamente.' });
  }

  await update('users', { id: user.id }, {
    session_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  });

  return json(
    res,
    200,
    {
      ok: true,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
        correo_verificado: user.correo_verificado,
        is_admin: user.is_admin,
        username: user.username,
        phone: user.phone,
        city: user.city,
        company: user.company,
        job_title: user.job_title,
        bio: user.bio,
        website: user.website
      }
    },
    [refreshSessionCookie(user)]
  );
}

