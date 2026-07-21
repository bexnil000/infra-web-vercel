import bcrypt from 'bcryptjs';
import { body, json, method } from './_lib/http.js';
import { refreshSessionCookie, requireUser } from './_lib/auth.js';
import { remove, update } from './_lib/supabase.js';
import { validatePassword } from './_lib/password.js';

export default async function handler(req, res) {
  if (!method(req, res, ['PUT'])) return;
  const user = await requireUser(req);
  if (!user) return json(res, 401, { ok: false, message: 'No autorizado.' });
  try {
    const data = await body(req);
    const firstName = String(data.first_name || '').trim();
    const lastName = String(data.last_name || '').trim();
    const currentPassword = String(data.current_password || '');
    const newPassword = String(data.new_password || '');
    const confirmation = String(data.password_confirmation || '');
    const username = String(data.username || '').trim() || null;
    const phone = String(data.phone || '').trim() || null;
    const city = String(data.city || '').trim() || null;
    const company = String(data.company || '').trim() || null;
    const jobTitle = String(data.job_title || '').trim() || null;
    const bio = String(data.bio || '').trim() || null;
    const website = String(data.website || '').trim() || null;
    const errors = [];
    if (firstName.length < 2 || firstName.length > 80) errors.push('El nombre debe tener entre 2 y 80 caracteres.');
    if (lastName.length < 2 || lastName.length > 80) errors.push('El apellido debe tener entre 2 y 80 caracteres.');
    const wantsPassword = currentPassword || newPassword || confirmation;
    if (username && !/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) errors.push('El usuario debe tener entre 3 y 30 caracteres válidos.');
    if (phone && !/^[+0-9 ()-]{7,25}$/.test(phone)) errors.push('El teléfono no tiene un formato válido.');
    if (bio && bio.length > 500) errors.push('La descripción no puede superar 500 caracteres.');
    if (website) {
      try { new URL(website); } catch { errors.push('El sitio web debe ser una URL válida.'); }
    }
    const payload = { first_name: firstName, last_name: lastName, username, phone, city, company, job_title: jobTitle, bio, website };
    if (wantsPassword) {
      if (!(await bcrypt.compare(currentPassword, user.password))) errors.push('La contraseña actual no es correcta.');
      errors.push(...validatePassword(newPassword));
      if (newPassword !== confirmation) errors.push('La confirmación de contraseña no coincide.');
      payload.password = await bcrypt.hash(newPassword, 12);
    }
    if (errors.length) return json(res, 422, { ok: false, message: errors.join(' ') });
    await update('users', { id: user.id }, payload);
    if (wantsPassword) await remove('remember_tokens', { user_id: user.id });
    return json(res, 200, { ok: true, message: 'Perfil actualizado correctamente.' }, [refreshSessionCookie(user)]);
  } catch (error) {
    return json(res, error.statusCode || 500, { ok: false, message: error.message });
  }
}


