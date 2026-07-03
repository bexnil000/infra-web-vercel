import { body, json, method } from './_lib/http.js';
import { insert } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  try {
    const data = await body(req);
    const name = String(data.nombre || '').trim();
    const email = String(data.email || '').trim().toLowerCase();
    const company = String(data.empresa || '').trim();
    const message = String(data.mensaje || '').trim();
    const errors = [];
    if (name.length < 2 || name.length > 100) errors.push('El nombre debe tener entre 2 y 100 caracteres.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Ingresa un correo válido.');
    if (company.length > 100) errors.push('La empresa no puede superar 100 caracteres.');
    if (message.length < 10 || message.length > 1000) errors.push('El mensaje debe tener entre 10 y 1000 caracteres.');
    if (errors.length) return json(res, 422, { ok: false, message: errors.join(' ') });
    await insert('contact_messages', { name, email, company: company || null, message });
    return json(res, 200, { ok: true, message: 'Mensaje enviado. Nuestro equipo te contactará en menos de 4 horas.' });
  } catch (error) {
    return json(res, error.statusCode || 500, { ok: false, message: error.message });
  }
}


