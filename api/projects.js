import { body, json, method } from './_lib/http.js';
import { requireUser } from './_lib/auth.js';
import { insert, remove, selectMany, selectOne, update } from './_lib/supabase.js';

const STATUSES = new Set(['planning', 'active', 'paused', 'completed', 'archived']);
const PRIORITIES = new Set(['low', 'medium', 'high', 'urgent']);

function projectPayload(data) {
  const name = String(data.name || '').trim();
  const description = String(data.description || '').trim() || null;
  const status = String(data.status || 'planning');
  const priority = String(data.priority || 'medium');
  const startDate = data.start_date || null;
  const dueDate = data.due_date || null;
  const color = String(data.color || '#3b82f6');
  const errors = [];
  if (name.length < 2 || name.length > 120) errors.push('El nombre debe tener entre 2 y 120 caracteres.');
  if (description && description.length > 1000) errors.push('La descripción no puede superar 1000 caracteres.');
  if (!STATUSES.has(status)) errors.push('Estado de proyecto inválido.');
  if (!PRIORITIES.has(priority)) errors.push('Prioridad inválida.');
  if (!/^#[0-9a-f]{6}$/i.test(color)) errors.push('Color inválido.');
  if (startDate && dueDate && dueDate < startDate) errors.push('La fecha límite debe ser posterior al inicio.');
  if (errors.length) { const error = new Error(errors.join(' ')); error.statusCode = 422; throw error; }
  return { name, description, status, priority, start_date: startDate, due_date: dueDate, color };
}

export default async function handler(req, res) {
  if (!method(req, res, ['GET', 'POST', 'PUT', 'DELETE'])) return;
  const user = await requireUser(req);
  if (!user) return json(res, 401, { ok: false, message: 'No autorizado.' });
  try {
    const id = String(req.query?.id || '');
    if (req.method === 'GET') {
      if (id) {
        const project = await selectOne('projects', { id, owner_id: user.id });
        return project ? json(res, 200, { ok: true, project }) : json(res, 404, { ok: false, message: 'Proyecto no encontrado.' });
      }
      const projects = await selectMany('projects', { owner_id: user.id }, '*', { order: 'updated_at.desc', limit: 100 });
      return json(res, 200, { ok: true, projects });
    }
    if (req.method === 'POST') {
      const project = await insert('projects', { ...projectPayload(await body(req)), owner_id: user.id });
      return json(res, 201, { ok: true, project, message: 'Proyecto creado.' });
    }
    if (!id || !(await selectOne('projects', { id, owner_id: user.id }, 'id'))) return json(res, 404, { ok: false, message: 'Proyecto no encontrado.' });
    if (req.method === 'PUT') {
      const [project] = await update('projects', { id, owner_id: user.id }, projectPayload(await body(req)));
      return json(res, 200, { ok: true, project, message: 'Proyecto actualizado.' });
    }
    await remove('projects', { id, owner_id: user.id });
    return json(res, 200, { ok: true, message: 'Proyecto eliminado.' });
  } catch (error) { return json(res, error.statusCode || 500, { ok: false, message: error.message }); }
}

