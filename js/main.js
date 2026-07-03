/**
 * NEXCORE — main.js
 * Vanilla JS · Sin dependencias externas
 * Funcionalidades: navbar, tabs, métricas animadas,
 *                  terminal simulada, formulario seguro
 */

'use strict';

/* ══════════════════════════════════════════════
   UTILIDADES DE SEGURIDAD
══════════════════════════════════════════════ */

/**
 * Sanitiza una cadena escapando caracteres especiales HTML.
 * Previene XSS básico en el lado del cliente.
 */
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Valida que un correo electrónico tenga formato válido (RFC 5322 simplificado).
 */
function isValidEmail(email) {
  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

/* ══════════════════════════════════════════════
   NAVBAR — scroll + menú hamburguesa
══════════════════════════════════════════════ */
(function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const toggle    = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');
  const allLinks  = navLinks.querySelectorAll('.nav-link, .nav-cta');

  // Sombra al hacer scroll
  window.addEventListener('scroll', () => {
    navbar.style.boxShadow = window.scrollY > 20
      ? '0 2px 24px rgba(0,0,0,0.4)'
      : '';
  }, { passive: true });

  // Menú hamburguesa (móvil)
  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Cerrar menú al hacer clic en un enlace
  allLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });

  // Indicador de sección activa al hacer scroll
  const sections = document.querySelectorAll('section[id]');

  const observerOptions = {
    root: null,
    rootMargin: '-40% 0px -55% 0px',
    threshold: 0
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const activeLink = navLinks.querySelector(`a[href="#${entry.target.id}"]`);
        if (activeLink) activeLink.classList.add('active');
      }
    });
  }, observerOptions);

  sections.forEach(s => sectionObserver.observe(s));
})();

/* ══════════════════════════════════════════════
   TABS — Módulo Innovación
══════════════════════════════════════════════ */
(function initTabs() {
  const tabBtns   = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      // Desactivar todos
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(p => p.classList.remove('active'));

      // Activar el seleccionado
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const panel = document.getElementById(`tab-${target}`);
      if (panel) panel.classList.add('active');
    });
  });
})();

/* ══════════════════════════════════════════════
   MÉTRICAS — Contadores animados + barras
══════════════════════════════════════════════ */
(function initMetrics() {
  const metricValues = document.querySelectorAll('.metric-value[data-target]');
  const metricBars   = document.querySelectorAll('.metric-bar[data-width]');

  /**
   * Anima un número desde 0 hasta el valor objetivo.
   */
  function animateCounter(el) {
    const target  = parseFloat(el.dataset.target);
    const suffix  = el.dataset.suffix || '';
    const isFloat = String(target).includes('.');
    const duration = 1800;
    const start    = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      // Easing out cubic
      const eased   = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      el.textContent = isFloat
        ? current.toFixed(2) + suffix
        : Math.floor(current).toLocaleString('es-MX') + suffix;

      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  /**
   * Anima las barras de progreso.
   */
  function animateBars() {
    metricBars.forEach(bar => {
      bar.style.width = bar.dataset.width + '%';
    });
  }

  // Disparar animaciones cuando la sección de métricas sea visible
  const section = document.getElementById('metricas');
  let triggered = false;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !triggered) {
      triggered = true;
      metricValues.forEach(el => animateCounter(el));
      animateBars();
    }
  }, { threshold: 0.2 });

  if (section) observer.observe(section);
})();

/* ══════════════════════════════════════════════
   TERMINAL SIMULADA
══════════════════════════════════════════════ */
(function initTerminal() {
  const terminal = document.getElementById('terminal');
  if (!terminal) return;

  const lines = [
    { text: '$ nexcore-cli status --all', cls: 't-line' },
    { text: '✓ backbone-fiber-01       [ONLINE]   latencia: 12ms', cls: 't-ok',   delay: 400 },
    { text: '✓ sat-leo-cluster-07      [ONLINE]   latencia: 18ms', cls: 't-ok',   delay: 700 },
    { text: '✓ edge-node-mty-03        [ONLINE]   latencia: 6ms',  cls: 't-ok',   delay: 1000 },
    { text: '⚠ hpc-rack-b9             [WARM]     carga: 87%',     cls: 't-warn', delay: 1300 },
    { text: '✓ firewall-zone-alpha     [ACTIVE]   reglas: 4.821',  cls: 't-ok',   delay: 1600 },
    { text: '✓ soc-monitor             [WATCHING] amenazas hoy: 0', cls: 't-ok',  delay: 1900 },
    { text: '$ ping nexcore.io — 38ms · 0% packet loss', cls: 't-info', delay: 2400 },
    { text: '— Sistema operando dentro de parámetros nominales —', cls: 't-info', delay: 2800 },
  ];

  const section = document.getElementById('metricas');
  let triggered = false;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !triggered) {
      triggered = true;

      lines.forEach(({ text, cls, delay = 0 }) => {
        setTimeout(() => {
          const line = document.createElement('div');
          line.className = cls;
          line.textContent = text;
          terminal.appendChild(line);
          terminal.scrollTop = terminal.scrollHeight;
        }, delay);
      });
    }
  }, { threshold: 0.3 });

  if (section) observer.observe(section);
})();

/* ══════════════════════════════════════════════
   FORMULARIO DE CONTACTO — validación segura
══════════════════════════════════════════════ */
(function initForm() {
  const form       = document.getElementById('contactForm');
  if (!form) return;

  const nombreInput  = document.getElementById('nombre');
  const emailInput   = document.getElementById('email');
  const mensajeInput = document.getElementById('mensaje');
  const charCount    = document.getElementById('charCount');
  const formAlert    = document.getElementById('form-alert');
  const submitBtn    = document.getElementById('submitBtn');

  /* — Contador de caracteres — */
  if (mensajeInput && charCount) {
    mensajeInput.addEventListener('input', () => {
      const len = mensajeInput.value.length;
      charCount.textContent = `${len} / 1000`;
      charCount.style.color = len > 900 ? '#f87171' : '';
    });
  }

  /* — Mostrar/limpiar error inline — */
  function setError(input, errorId, msg) {
    const errEl = document.getElementById(errorId);
    if (errEl) errEl.textContent = msg;
    if (msg) {
      input.classList.add('error');
      input.classList.remove('success');
    } else {
      input.classList.remove('error');
      input.classList.add('success');
    }
  }

  /* — Alerta global — */
  function showAlert(msg, type) {
    formAlert.textContent = sanitize(msg);
    formAlert.className   = `form-alert show ${type}`;
  }

  function hideAlert() {
    formAlert.className = 'form-alert';
    formAlert.textContent = '';
  }

  /* — Validación en tiempo real — */
  nombreInput.addEventListener('blur', () => {
    const val = nombreInput.value.trim();
    if (!val) setError(nombreInput, 'error-nombre', 'El nombre es obligatorio.');
    else if (val.length < 2) setError(nombreInput, 'error-nombre', 'Mínimo 2 caracteres.');
    else setError(nombreInput, 'error-nombre', '');
  });

  emailInput.addEventListener('blur', () => {
    const val = emailInput.value.trim();
    if (!val) setError(emailInput, 'error-email', 'El correo es obligatorio.');
    else if (!isValidEmail(val)) setError(emailInput, 'error-email', 'Formato de correo inválido.');
    else setError(emailInput, 'error-email', '');
  });

  mensajeInput.addEventListener('blur', () => {
    const val = mensajeInput.value.trim();
    if (!val) setError(mensajeInput, 'error-mensaje', 'El mensaje no puede estar vacío.');
    else if (val.length < 10) setError(mensajeInput, 'error-mensaje', 'Mínimo 10 caracteres.');
    else setError(mensajeInput, 'error-mensaje', '');
  });

  /* — Envío del formulario — */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideAlert();

    // Recoger y sanitizar valores
    const nombre  = sanitize(nombreInput.value);
    const email   = sanitize(emailInput.value);
    const empresa = sanitize(document.getElementById('empresa').value);
    const mensaje = sanitize(mensajeInput.value);

    // Validación final
    let valid = true;

    if (!nombre || nombre.length < 2) {
      setError(nombreInput, 'error-nombre', 'El nombre es obligatorio (mín. 2 caracteres).');
      valid = false;
    } else {
      setError(nombreInput, 'error-nombre', '');
    }

    if (!email || !isValidEmail(email)) {
      setError(emailInput, 'error-email', 'Ingresa un correo electrónico válido.');
      valid = false;
    } else {
      setError(emailInput, 'error-email', '');
    }

    if (!mensaje || mensaje.length < 10) {
      setError(mensajeInput, 'error-mensaje', 'El mensaje debe tener al menos 10 caracteres.');
      valid = false;
    } else {
      setError(mensajeInput, 'error-mensaje', '');
    }

    if (!valid) {
      showAlert('Por favor corrige los errores antes de continuar.', 'error');
      return;
    }

    // Enviar al backend PHP usando el action del formulario.
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    fetch(form.action, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nombre, email, empresa, mensaje })
    })
    .then(async response => {
      const data = await response.json().catch(() => ({
        ok: false,
        message: 'No se pudo interpretar la respuesta del servidor.'
      }));

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'No se pudo enviar el mensaje.');
      }

      showAlert('✓ ' + data.message, 'success');
      form.reset();
      charCount.textContent = '0 / 1000';
      document.querySelectorAll('.form-input').forEach(i => i.classList.remove('success', 'error'));
    })
    .catch(error => {
      showAlert(error.message, 'error');
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar mensaje seguro →';
    });
  });
})();

/* ══════════════════════════════════════════════
   SCROLL REVEAL — animación suave al entrar
══════════════════════════════════════════════ */
(function initReveal() {
  const targets = document.querySelectorAll('.card, .metric-card, .tab-body, .contact-form');

  targets.forEach(el => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  targets.forEach(el => revealObserver.observe(el));
})();


