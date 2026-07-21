import { json, method } from './_lib/http.js';
import { requireUser } from './_lib/auth.js';
import { selectMany } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (!method(req, res, ['GET'])) return;
  const user = await requireUser(req);
  if (!user) return json(res, 401, { ok: false, message: 'No autorizado.' });
  try {
    const [projects, tasks] = await Promise.all([
      selectMany('projects', { owner_id: user.id }, 'id,name,status,updated_at', { order: 'updated_at.desc', limit: 100 }),
      selectMany('tasks', { owner_id: user.id }, 'id,title,status,due_date,project_id,updated_at', { order: 'updated_at.desc', limit: 200 })
    ]);
    const completed = tasks.filter(task => task.status === 'completed').length;
    const pending = tasks.length - completed;
    const overdue = tasks.filter(task => task.status !== 'completed' && task.due_date && new Date(task.due_date) < new Date()).length;
    return json(res, 200, { ok: true, metrics: { active_projects: projects.filter(p => p.status === 'active').length, projects: projects.length, pending_tasks: pending, completed_tasks: completed, overdue_tasks: overdue, progress: tasks.length ? Math.round(completed * 100 / tasks.length) : 0 }, recent_projects: projects.slice(0, 5), upcoming_tasks: tasks.filter(t => t.status !== 'completed' && t.due_date).sort((a,b) => a.due_date.localeCompare(b.due_date)).slice(0, 5) });
  } catch (error) { return json(res, 500, { ok: false, message: error.message }); }
}
