import { body, json, method } from './http.js';
import { requireUser } from './auth.js';
import { insert, selectMany, selectOne, update } from './supabase.js';

const ROLES = new Set(['manager', 'collaborator', 'viewer']);

async function ownedProject(user, projectId) {
  return projectId ? selectOne('projects', { id: projectId, owner_id: user.id }, 'id,name,owner_id') : null;
}

export default async function handler(req, res) {
  if (!method(req, res, ['GET', 'POST', 'PATCH'])) return;
  const user = await requireUser(req);
  if (!user) return json(res, 401, { ok: false, message: 'No autorizado.' });
  try {
    if (req.method === 'GET') {
      const taskId = String(req.query?.task_id || '');
      if (taskId) {
        const task = await selectOne('tasks', { id: taskId, owner_id: user.id }, 'id');
        if (!task) return json(res, 403, { ok: false, message: 'No tienes acceso a la tarea.' });
        const comments = await selectMany('task_comments', { task_id: taskId }, '*', { order: 'created_at.asc', limit: 100 });
        const userIds = [...new Set(comments.map(item => item.user_id))];
        const authors = userIds.length ? await selectMany('users', { id: `in.(${userIds.join(',')})` }, 'id,first_name,last_name') : [];
        return json(res, 200, { ok: true, comments, authors });
      }
      const projects = await selectMany('projects', { owner_id: user.id }, 'id,name');
      const ids = projects.map(item => item.id);
      const members = ids.length ? await selectMany('project_members', { project_id: `in.(${ids.join(',')})` }, '*') : [];
      const memberIds = [...new Set(members.map(item => item.user_id))];
      const people = memberIds.length ? await selectMany('users', { id: `in.(${memberIds.join(',')})` }, 'id,first_name,last_name,email,username') : [];
      const notifications = await selectMany('notifications', { user_id: user.id }, '*', { order: 'created_at.desc', limit: 30 });
      return json(res, 200, { ok: true, projects, members, people, notifications });
    }

    const data = await body(req);
    if (req.method === 'PATCH') {
      const id = String(data.id || '');
      if (!id || !(await selectOne('notifications', { id, user_id: user.id }, 'id'))) return json(res, 404, { ok: false, message: 'Notificación no encontrada.' });
      await update('notifications', { id, user_id: user.id }, { read_at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    const action = String(data.action || '');
    if (action === 'invite') {
      const project = await ownedProject(user, String(data.project_id || ''));
      if (!project) return json(res, 403, { ok: false, message: 'Solo el propietario puede invitar.' });
      const email = String(data.email || '').trim().toLowerCase();
      const role = String(data.role || 'collaborator');
      if (!ROLES.has(role)) return json(res, 422, { ok: false, message: 'Rol inválido.' });
      const invited = await selectOne('users', { email }, 'id,first_name,last_name,email');
      if (!invited) return json(res, 404, { ok: false, message: 'El usuario debe crear y verificar su cuenta antes de ser invitado.' });
      if (invited.id === user.id) return json(res, 422, { ok: false, message: 'Ya eres propietario del proyecto.' });
      if (await selectOne('project_members', { project_id: project.id, user_id: invited.id }, 'project_id')) return json(res, 409, { ok: false, message: 'Ese usuario ya pertenece al proyecto.' });
      await insert('project_members', { project_id: project.id, user_id: invited.id, role });
      await insert('notifications', { user_id: invited.id, type: 'project_invite', title: 'Nuevo proyecto compartido', message: `Te agregaron a ${project.name}.` });
      return json(res, 201, { ok: true, message: 'Colaborador agregado.' });
    }
    if (action === 'comment') {
      const taskId = String(data.task_id || '');
      const task = await selectOne('tasks', { id: taskId, owner_id: user.id }, 'id,title,assignee_id');
      if (!task) return json(res, 403, { ok: false, message: 'No tienes acceso a la tarea.' });
      const text = String(data.body || '').trim();
      if (!text || text.length > 1200) return json(res, 422, { ok: false, message: 'El comentario debe tener entre 1 y 1200 caracteres.' });
      const comment = await insert('task_comments', { task_id: taskId, user_id: user.id, body: text });
      if (task.assignee_id && task.assignee_id !== user.id) await insert('notifications', { user_id: task.assignee_id, type: 'task_comment', title: 'Nuevo comentario', message: `Comentaron en ${task.title}.` });
      return json(res, 201, { ok: true, comment, message: 'Comentario agregado.' });
    }
    return json(res, 422, { ok: false, message: 'Acción no válida.' });
  } catch (error) {
    return json(res, error.statusCode || 500, { ok: false, message: error.message });
  }
}
