const state = { user: null, projects: [], tasks: [] };
const labels = { planning: 'Planeación', active: 'Activo', paused: 'Pausado', completed: 'Completado', archived: 'Archivado', pending: 'Pendiente', in_progress: 'En proceso', review: 'En revisión', low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente' };

async function api(path, options = {}) {
  const response = await fetch(path, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({ ok: false, message: 'Respuesta inválida del servidor.' }));
  if (!response.ok || data.ok === false) { const error = new Error(data.message || 'No se pudo completar la solicitud.'); error.status = response.status; throw error; }
  return data;
}
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const formData = form => Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]));
function showAlert(message, type = 'success', target = document.querySelector('#appAlert')) { target.textContent = message; target.className = `form-alert show ${type}`; setTimeout(() => target.classList.remove('show'), 4500); }
function empty(message) { return `<div class="empty-state"><b>Sin resultados</b><p>${escapeHtml(message)}</p></div>`; }
function formatDate(value) { return value ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`)) : 'Sin fecha'; }

function switchView(name) {
  document.querySelectorAll('.app-view').forEach(panel => panel.classList.toggle('active', panel.dataset.viewPanel === name));
  document.querySelectorAll('.app-nav-link[data-view]').forEach(link => link.classList.toggle('active', link.dataset.view === name));
  document.querySelector('#sidebar').classList.remove('mobile-open');
}

function applyTheme(theme) { document.documentElement.dataset.theme = theme; localStorage.setItem('nexcore-theme', theme); }
function toggleTheme() { applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'); }

function renderProjects() {
  const query = document.querySelector('#projectSearch').value.toLowerCase();
  const filter = document.querySelector('#projectFilter').value;
  const rows = state.projects.filter(project => (!query || `${project.name} ${project.description || ''}`.toLowerCase().includes(query)) && (!filter || project.status === filter));
  document.querySelector('#projectGrid').innerHTML = rows.length ? rows.map(project => `<article class="project-card" style="--project-color:${escapeHtml(project.color)}"><div class="project-card-head"><span class="status-pill">${labels[project.status]}</span><span class="priority ${project.priority}">${labels[project.priority]}</span></div><h2>${escapeHtml(project.name)}</h2><p>${escapeHtml(project.description || 'Sin descripción')}</p><div class="project-dates"><span>Inicio: ${formatDate(project.start_date)}</span><span>Límite: ${formatDate(project.due_date)}</span></div><div class="card-actions"><button class="btn-ghost" data-edit-project="${project.id}">Editar</button><button class="btn-ghost" data-project-tasks="${project.id}">Tareas</button><button class="danger-button" data-delete-project="${project.id}">Eliminar</button></div></article>`).join('') : empty('Crea tu primer proyecto para comenzar.');
  const selector = document.querySelector('#taskForm select[name="project_id"]');
  selector.innerHTML = `<option value="">Selecciona un proyecto</option>${state.projects.filter(p => p.status !== 'archived').map(project => `<option value="${project.id}">${escapeHtml(project.name)}</option>`).join('')}`;
}

function renderTasks() {
  const columns = [['pending','Pendiente'],['in_progress','En proceso'],['review','En revisión'],['completed','Completada']];
  document.querySelector('#kanban').innerHTML = columns.map(([status, title]) => { const tasks = state.tasks.filter(task => task.status === status); return `<section class="kanban-column" data-status="${status}"><header><h2>${title}</h2><span>${tasks.length}</span></header><div class="kanban-drop">${tasks.map(task => { const project = state.projects.find(p => p.id === task.project_id); const overdue = task.due_date && status !== 'completed' && new Date(`${task.due_date}T23:59:59`) < new Date(); return `<article class="task-card ${overdue ? 'overdue' : ''}" draggable="true" data-task-id="${task.id}"><span class="priority ${task.priority}">${labels[task.priority]}</span><h3>${escapeHtml(task.title)}</h3><p>${escapeHtml(project?.name || 'Proyecto')}</p><footer><time>${formatDate(task.due_date)}</time><button data-delete-task="${task.id}" aria-label="Eliminar tarea">×</button></footer></article>`; }).join('') || empty('No hay tareas en esta columna.')}</div></section>`; }).join('');
}

async function loadDashboard() {
  const [session, projects, tasks, dashboard] = await Promise.all([api('/api/session'), api('/api/projects'), api('/api/tasks'), api('/api/dashboard')]);
  state.user = session.user; state.projects = projects.projects; state.tasks = tasks.tasks;
  document.querySelectorAll('[data-user-first]').forEach(el => { el.textContent = state.user.first_name; });
  document.querySelector('[data-user-short]').textContent = `${state.user.first_name} ${state.user.last_name}`;
  document.querySelector('[data-user-initials]').textContent = `${state.user.first_name[0] || ''}${state.user.last_name[0] || ''}`.toUpperCase();
  const metricLabels = [['active_projects','Proyectos activos'],['pending_tasks','Tareas pendientes'],['completed_tasks','Tareas completadas'],['overdue_tasks','Tareas vencidas'],['progress','Progreso general']];
  document.querySelector('#metrics').innerHTML = metricLabels.map(([key,label]) => `<article class="metric-card"><span class="metric-label">${label}</span><strong class="metric-value">${dashboard.metrics[key]}${key === 'progress' ? '%' : ''}</strong>${key === 'progress' ? `<div class="progress"><i style="width:${dashboard.metrics[key]}%"></i></div>` : ''}</article>`).join('');
  document.querySelector('#recentProjects').innerHTML = dashboard.recent_projects.length ? dashboard.recent_projects.map(p => `<button data-project-tasks="${p.id}"><span><b>${escapeHtml(p.name)}</b><small>${labels[p.status]}</small></span><i>→</i></button>`).join('') : empty('Todavía no tienes proyectos.');
  document.querySelector('#upcomingTasks').innerHTML = dashboard.upcoming_tasks.length ? dashboard.upcoming_tasks.map(t => `<div><span><b>${escapeHtml(t.title)}</b><small>${formatDate(t.due_date)}</small></span></div>`).join('') : empty('No hay vencimientos próximos.');
  Object.entries(state.user).forEach(([key,value]) => { const input = document.querySelector(`#profileForm [name="${key}"]`); if (input) input.value = value || ''; });
  document.querySelector('[data-user-email]').textContent = state.user.email;
  document.querySelector('[data-user-created]').textContent = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(new Date(state.user.created_at));
  renderProjects(); renderTasks();
}

document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
document.querySelector('#sidebarToggle').addEventListener('click', () => document.querySelector('#sidebar').classList.toggle('collapsed'));
document.querySelector('#mobileMenu').addEventListener('click', () => document.querySelector('#sidebar').classList.toggle('mobile-open'));
document.querySelector('#themeToggle').addEventListener('click', toggleTheme); document.querySelector('#settingsTheme').addEventListener('click', toggleTheme);
applyTheme(localStorage.getItem('nexcore-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
document.querySelector('#today').textContent = new Intl.DateTimeFormat('es-MX', { dateStyle: 'full' }).format(new Date());
document.querySelectorAll('[data-open-project]').forEach(button => button.addEventListener('click', () => { const form = document.querySelector('#projectForm'); form.reset(); delete form.dataset.editId; form.querySelector('h2').textContent = 'Nuevo proyecto'; form.querySelector('[type="submit"]').textContent = 'Crear proyecto'; document.querySelector('#projectDialog').showModal(); }));
document.querySelector('[data-open-task]').addEventListener('click', () => state.projects.length ? document.querySelector('#taskDialog').showModal() : showAlert('Primero crea un proyecto.', 'error'));
document.querySelector('#projectSearch').addEventListener('input', renderProjects); document.querySelector('#projectFilter').addEventListener('change', renderProjects);

document.querySelector('#projectForm').addEventListener('submit', async event => { event.preventDefault(); const id = event.currentTarget.dataset.editId; try { await api(id ? `/api/projects?id=${encodeURIComponent(id)}` : '/api/projects', { method: id ? 'PUT' : 'POST', body: JSON.stringify(formData(event.currentTarget)) }); event.currentTarget.reset(); delete event.currentTarget.dataset.editId; document.querySelector('#projectDialog').close(); await loadDashboard(); showAlert(id ? 'Proyecto actualizado.' : 'Proyecto creado.'); } catch (error) { showAlert(error.message, 'error', event.currentTarget.querySelector('.form-alert')); } });
document.querySelector('#taskForm').addEventListener('submit', async event => { event.preventDefault(); try { await api('/api/tasks', { method: 'POST', body: JSON.stringify(formData(event.currentTarget)) }); event.currentTarget.reset(); document.querySelector('#taskDialog').close(); await loadDashboard(); showAlert('Tarea creada.'); } catch (error) { showAlert(error.message, 'error', event.currentTarget.querySelector('.form-alert')); } });
document.querySelector('#profileForm').addEventListener('submit', async event => { event.preventDefault(); const data = formData(event.currentTarget); if (data.new_password !== data.password_confirmation) return showAlert('Las contraseñas no coinciden.', 'error', event.currentTarget.querySelector('.form-alert')); try { await api('/api/profile', { method: 'PUT', body: JSON.stringify(data) }); await loadDashboard(); showAlert('Perfil actualizado.', 'success', event.currentTarget.querySelector('.form-alert')); } catch (error) { showAlert(error.message, 'error', event.currentTarget.querySelector('.form-alert')); } });

document.addEventListener('click', async event => {
  const projectEdit = event.target.closest('[data-edit-project]'); if (projectEdit) { const project = state.projects.find(item => item.id === projectEdit.dataset.editProject); const form = document.querySelector('#projectForm'); form.reset(); Object.entries(project).forEach(([key,value]) => { if (form.elements[key]) form.elements[key].value = value || ''; }); form.dataset.editId = project.id; form.querySelector('h2').textContent = 'Editar proyecto'; form.querySelector('[type="submit"]').textContent = 'Guardar cambios'; document.querySelector('#projectDialog').showModal(); return; }
  const projectLink = event.target.closest('[data-project-tasks]'); if (projectLink) { switchView('tasks'); return; }
  const projectDelete = event.target.closest('[data-delete-project]'); if (projectDelete && confirm('¿Eliminar este proyecto y todas sus tareas? Esta acción no se puede deshacer.')) { try { await api(`/api/projects?id=${encodeURIComponent(projectDelete.dataset.deleteProject)}`, { method: 'DELETE' }); await loadDashboard(); showAlert('Proyecto eliminado.'); } catch (error) { showAlert(error.message, 'error'); } }
  const taskDelete = event.target.closest('[data-delete-task]'); if (taskDelete && confirm('¿Eliminar esta tarea?')) { try { await api(`/api/tasks?id=${encodeURIComponent(taskDelete.dataset.deleteTask)}`, { method: 'DELETE' }); await loadDashboard(); showAlert('Tarea eliminada.'); } catch (error) { showAlert(error.message, 'error'); } }
});

document.addEventListener('dragstart', event => { const card = event.target.closest('.task-card'); if (card) event.dataTransfer.setData('text/plain', card.dataset.taskId); });
document.addEventListener('dragover', event => { if (event.target.closest('.kanban-column')) event.preventDefault(); });
document.addEventListener('drop', async event => { const column = event.target.closest('.kanban-column'); if (!column) return; event.preventDefault(); const id = event.dataTransfer.getData('text/plain'); const task = state.tasks.find(item => item.id === id); if (!task || task.status === column.dataset.status) return; try { await api(`/api/tasks?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ ...task, status: column.dataset.status }) }); await loadDashboard(); showAlert('Estado de tarea actualizado.'); } catch (error) { showAlert(error.message, 'error'); } });

let searchTimer; document.querySelector('#globalSearch').addEventListener('input', event => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { const query = event.target.value.toLowerCase(); if (!query) return; const project = state.projects.find(p => p.name.toLowerCase().includes(query)); if (project) { switchView('projects'); document.querySelector('#projectSearch').value = query; renderProjects(); return; } const task = state.tasks.find(t => t.title.toLowerCase().includes(query)); if (task) switchView('tasks'); }, 250); });
document.querySelector('[data-logout]').addEventListener('click', async () => { await api('/api/logout', { method: 'POST' }).catch(() => {}); location.href = '/index.html'; });

let inactivityTimer; const scheduleLogout = () => { clearTimeout(inactivityTimer); inactivityTimer = setTimeout(async () => { await api('/api/logout', { method: 'POST' }).catch(() => {}); location.href = '/login.html?expired=1'; }, 15 * 60 * 1000); }; ['click','keydown','scroll','touchstart'].forEach(name => addEventListener(name, scheduleLogout, { passive: true })); scheduleLogout();
loadDashboard().catch(error => { if (error.status === 401) location.href = '/login.html?expired=1'; else showAlert(error.message, 'error'); });
