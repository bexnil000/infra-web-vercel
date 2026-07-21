import bcrypt from 'bcryptjs';
import { body, json, method } from './_lib/http.js';
import { selectOne, update } from './_lib/supabase.js';
import { makeSession, sessionCookie } from './_lib/auth.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export default async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;

  try {
    const data = await body(req);
    const email = String(data.email || '').trim().toLowerCase();
    const password = String(data.password || '');
    const remember = Boolean(data.remember);

    const user = await selectOne(
      'users',
      { email },
      'id,first_name,last_name,email,password,correo_verificado,is_admin,failed_login_attempts,locked_until'
    );

    if (!user) {
      return json(res, 401, { ok: false, message: 'Correo no registrado.' });
    }

    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      return json(res, 403, { ok: false, message: 'Cuenta bloqueada temporalmente. Intenta nuevamente en unos minutos.' });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      const attempts = Number(user.failed_login_attempts || 0) + 1;
      const locked = attempts >= MAX_FAILED_ATTEMPTS;
      await update('users', { id: user.id }, {
        failed_login_attempts: attempts,
        locked_until: locked ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString() : null
      });

      if (locked) {
        return json(res, 403, { ok: false, message: 'Cuenta bloqueada temporalmente por varios intentos fallidos.' });
      }

      return json(res, 401, { ok: false, message: `Contraseña inválida. Intentos restantes: ${MAX_FAILED_ATTEMPTS - attempts}.` });
    }

    if (!user.correo_verificado) {
      return json(res, 403, { ok: false, message: 'Debes confirmar tu correo antes de iniciar sesión.' });
    }

    await update('users', { id: user.id }, {
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
      session_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });

    return json(res, 200, { ok: true, message: 'Sesión iniciada.' }, [sessionCookie(makeSession(user, remember), remember)]);
  } catch (error) {
    return json(res, error.statusCode || 500, { ok: false, message: error.message });
  }
}


