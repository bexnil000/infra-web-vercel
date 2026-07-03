import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { body, json, method, publicUrl } from './_lib/http.js';
import { insert, remove, selectOne } from './_lib/supabase.js';
import { sendVerificationEmail } from './_lib/mail.js';
import { validatePassword } from './_lib/password.js';

export default async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;

  try {
    const data = await body(req);
    const firstName = String(data.first_name || '').trim();
    const lastName = String(data.last_name || '').trim();
    const email = String(data.email || '').trim().toLowerCase();
    const password = String(data.password || '');
    const confirmation = String(data.password_confirmation || '');
    const errors = [];

    if (firstName.length < 2 || firstName.length > 80) errors.push('El nombre debe tener entre 2 y 80 caracteres.');
    if (lastName.length < 2 || lastName.length > 80) errors.push('El apellido debe tener entre 2 y 80 caracteres.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Ingresa un correo válido.');
    errors.push(...validatePassword(password));
    if (password !== confirmation) errors.push('Las contraseñas no coinciden.');
    if (errors.length) return json(res, 422, { ok: false, message: errors.join(' ') });

    if (await selectOne('users', { email }, 'id')) {
      return json(res, 409, { ok: false, message: 'Ya existe una cuenta registrada con ese correo.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const user = await insert('users', {
      first_name: firstName,
      last_name: lastName,
      email,
      password: await bcrypt.hash(password, 12),
      email_verification_token: crypto.createHash('sha256').update(token).digest('hex'),
      correo_verificado: false,
      is_admin: false
    });

    const link = `${publicUrl(req)}/verificar.html?token=${encodeURIComponent(token)}`;

    try {
      const delivery = await sendVerificationEmail(email, `${firstName} ${lastName}`, link);
      return json(res, 201, {
        ok: true,
        message: delivery.mode === 'debug'
          ? 'Cuenta creada. Configura SMTP en Vercel para enviar correos.'
          : 'Cuenta creada. Revisa tu correo para verificarla.',
        debugLink: delivery.mode === 'debug' ? link : undefined
      });
    } catch (error) {
      if (user?.id) await remove('users', { id: user.id });
      return json(res, 500, { ok: false, message: 'No se pudo enviar el correo de verificación.' });
    }
  } catch (error) {
    return json(res, error.statusCode || 500, { ok: false, message: error.message });
  }
}


