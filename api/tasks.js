import { body, json, method } from './_lib/http.js';
import { requireUser } from './_lib/auth.js';
import { insert, remove, selectMany, selectOne, update } from './_lib/supabase.js';

const STATUSES = new Set(['pending', 'in_progress', 'review', 'completed']);
const PRIORITIES = new Set(['low', 'medium', 'high', 'urgent']);
function taskPayload(data) {
  const title = String(data.title || '').trim();
  const description = String(data.description || '').trim() || null;
  const status = String(data.status || 'pending');
  const priority = String(data.priority || 'medium');
  const startDate = data.start_date || null;
  const dueDate = data.due_date || null;
  const errors = [];
  if (title.length < 2 || title.length > 160) errors.push('El título debe tener entre 2 y 160 caracteres.');
  if (description && description.length > 2000) errors.push('La descripción no puede superar 2000 caracteres.');
  if (!STATUSES.has(status)) errors.push('Estado de tarea inválido.');
  if (!PRIORITIES.has(priority)) errors.push('Prioridad inválida.');
  if (startDate && dueDate && dueDate < startDate) errors.push('La fecha límite debe ser posterior al inicio.');
  if (errors.length) { const error = new Error(errors.join(' ')); error.statusCode = 422; throw error; }
  return { title, description, status, priority, start_date: startDate, due_date: dueDate };
}
export default async function handler(req, res) {
  if (!method(req, res, ['GET', 'POST', 'PUT', 'DELETE'])) return;
  const user = await requireUser(req);
  if (!user) return json(res, 401, { ok: false, message: 'No autorizado.' });
  try {
    const id = String(req.query?.id || '');
    const projectId = String(req.query?.project_id || '');
    if (req.method === 'GET') {
      const filters = { owner_id: user.id };
      if (projectId) filters.project_id = projectId;
      return json(res, 200, { ok: true, tasks: await selectMany('tasks', filters, '*', { order: 'updated_at.desc', limit: 200 }) });
    }
    if (req.method === 'POST') {
      const data = await body(req);
      const targetProject = String(data.project_id || '');
      if (!targetProject || !(await selectOne('projects', { id: targetProject, owner_id: user.id }, 'id'))) return json(res, 403, { ok: false, message: 'No tienes acceso al proyecto.' });
      const task = await insert('tasks', { ...taskPayload(data), project_id: targetProject, owner_id: user.id });
      return json(res, 201, { ok: true, task, message: 'Tarea creada.' });
    }
    if (!id || !(await selectOne('tasks', { id, owner_id: user.id }, 'id'))) return json(res, 404, { ok: false, message: 'Tarea no encontrada.' });
    if (req.method === 'PUT') {
      const [task] = await update('tasks', { id, owner_id: user.id }, taskPayload(await body(req)));
      return json(res, 200, { ok: true, task, message: 'Tarea actualizada.' });
    }
    await remove('tasks', { id, owner_id: user.id });
    return json(res, 200, { ok: true, message: 'Tarea eliminada.' });
  } catch (error) { return json(res, error.statusCode || 500, { ok: false, message: error.message }); }
}

