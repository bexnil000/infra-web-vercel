async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({ ok: false, message: 'Respuesta invalida del servidor.' }));
  if (!response.ok || data.ok === false) throw new Error(data.message || 'No se pudo completar la solicitud.');
  return data;
}

function alertBox(form, message, type = 'error') {
  let box = form.querySelector('.form-alert');
  if (!box) {
    box = document.createElement('div');
    form.prepend(box);
  }
  box.className = `form-alert show ${type}`;
  box.textContent = message;
}

function values(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function passwordsMatch(form, passwordName = 'password') {
  const password = form.elements[passwordName];
  const confirmation = form.elements.password_confirmation;
  if (!password || !confirmation || password.value === confirmation.value) return true;
  alertBox(form, 'Las contraseñas no coinciden.');
  confirmation.focus();
  return false;
}

function validateStrongPassword(form, passwordName = 'password') {
  const input = form.elements[passwordName];
  if (!input) return true;

  const value = input.value;
  const weak = ['12345678', '123456789', 'abc12345', 'password123', 'qwerty123', 'admin1234'];
  const errors = [];

  if (value.length < 8) errors.push('mínimo 8 caracteres');
  if (!/[A-Z]/.test(value)) errors.push('una mayúscula');
  if (!/[a-z]/.test(value)) errors.push('una minúscula');
  if (!/[0-9]/.test(value)) errors.push('un número');
  if (!/[^A-Za-z0-9]/.test(value)) errors.push('un carácter especial');
  if (/\s/.test(value)) errors.push('sin espacios');
  if (weak.includes(value.toLowerCase()) || /(1234|2345|3456|4567|5678|abcd|qwer|wert)/i.test(value)) {
    errors.push('no consecutiva ni débil');
  }

  if (!errors.length) return true;
  alertBox(form, `La contraseña debe incluir ${errors.join(', ')}.`);
  input.focus();
  return false;
}

async function redirectIfAuthenticated() {
  try {
    await api('/api/session');
    window.location.href = '/dashboard.html';
  } catch {
    // Usuario invitado: puede continuar en esta pagina.
  }
}

const path = window.location.pathname;

if (path.endsWith('/login.html')) {
  const loginForm = document.querySelector('form');
  if (new URLSearchParams(location.search).get('expired') === '1') {
    alertBox(loginForm, 'Tu sesión expiró por inactividad. Inicia sesión nuevamente.');
  }
  redirectIfAuthenticated();
  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await api('/api/login', { method: 'POST', body: JSON.stringify(values(form)) });
      window.location.href = '/dashboard.html';
    } catch (error) {
      alertBox(form, error.message);
    }
  });
}

if (path.endsWith('/register.html')) {
  redirectIfAuthenticated();
  document.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!passwordsMatch(form)) return;
    if (!validateStrongPassword(form)) return;
    try {
      const data = await api('/api/register', { method: 'POST', body: JSON.stringify(values(form)) });
      alertBox(form, data.debugLink ? `${data.message} ${data.debugLink}` : data.message, 'success');
      setTimeout(() => { window.location.href = '/login.html'; }, data.debugLink ? 6000 : 1400);
    } catch (error) {
      alertBox(form, error.message);
    }
  });
}

if (path.endsWith('/forgot_password.html')) {
  redirectIfAuthenticated();
  document.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      const data = await api('/api/forgot-password', { method: 'POST', body: JSON.stringify(values(form)) });
      alertBox(form, data.debugLink ? `${data.message} ${data.debugLink}` : data.message, 'success');
    } catch (error) {
      alertBox(form, error.message);
    }
  });
}

if (path.endsWith('/reset_password.html')) {
  redirectIfAuthenticated();
  const token = new URLSearchParams(location.search).get('token') || '';
  document.querySelector('input[name="token"]').value = token;
  document.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!passwordsMatch(form)) return;
    if (!validateStrongPassword(form)) return;
    try {
      const data = await api('/api/reset-password', { method: 'POST', body: JSON.stringify(values(form)) });
      alertBox(form, data.message, 'success');
      setTimeout(() => { window.location.href = '/login.html'; }, 1200);
    } catch (error) {
      alertBox(form, error.message);
    }
  });
}

if (path.endsWith('/verificar.html')) {
  const token = new URLSearchParams(location.search).get('token') || '';
  api(`/api/verify-email?token=${encodeURIComponent(token)}`)
    .then(data => {
      document.querySelector('.form-alert').className = 'form-alert show success';
      document.querySelector('.form-alert').textContent = data.message;
    })
    .catch(error => {
      document.querySelector('.form-alert').className = 'form-alert show error';
      document.querySelector('.form-alert').textContent = error.message;
    });
}

if (path.endsWith('/dashboard.html')) {
  const form = document.querySelector('form');
  let inactivityTimer;

  function scheduleInactivityLogout() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(async () => {
      await api('/api/logout', { method: 'POST' }).catch(() => {});
      window.location.href = '/login.html?expired=1';
    }, 15 * 60 * 1000);
  }

  ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(eventName => {
    window.addEventListener(eventName, scheduleInactivityLogout, { passive: true });
  });
  scheduleInactivityLogout();

  api('/api/session')
    .then(data => {
      const user = data.user;
      document.querySelector('[data-user-name]').textContent = `${user.first_name} ${user.last_name}`;
      document.querySelector('[data-user-email]').textContent = user.email;
      document.querySelector('[data-user-created]').textContent = new Date(user.created_at).toLocaleString('es-MX');
      form.first_name.value = user.first_name;
      form.last_name.value = user.last_name;
    })
    .catch(() => { window.location.href = '/login.html?expired=1'; });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (form.new_password.value || form.password_confirmation.value) {
      if (!passwordsMatch(form, 'new_password')) return;
      if (!validateStrongPassword(form, 'new_password')) return;
    }
    try {
      const data = await api('/api/profile', { method: 'PUT', body: JSON.stringify(values(form)) });
      alertBox(form, data.message, 'success');
    } catch (error) {
      alertBox(form, error.message);
    }
  });

  document.querySelector('[data-logout]').addEventListener('click', async () => {
    await api('/api/logout', { method: 'POST' });
    window.location.href = '/index.html';
  });
}

