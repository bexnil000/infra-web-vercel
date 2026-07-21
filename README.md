# NEXCORE - Documentación técnica

NEXCORE es una aplicación web desplegable en Vercel para presentar servicios de infraestructura tecnológica y operar un panel privado de usuarios administradores. El proyecto inspeccionado usa frontend HTML/CSS/JavaScript, APIs REST serverless en JavaScript dentro de `/api` y Supabase como backend de datos sobre PostgreSQL.

> Nota técnica: en la estructura actual no se encontraron carpetas ni archivos propios de Next.js (`app/`, `pages/`, `next.config.*`) ni TypeScript/Tailwind. Por restricción del proyecto, no se migró la arquitectura. Esta documentación describe la arquitectura real existente.

## Arquitectura

La aplicación sigue una separación Frontend / Backend:

- **Frontend:** páginas HTML estáticas, estilos CSS y JavaScript de interacción.
- **Backend/API:** funciones serverless compatibles con Vercel dentro de `/api`.
- **Base de datos:** Supabase con PostgreSQL y acceso mediante REST API de Supabase.
- **Autenticación:** cookies `HttpOnly` con JWT firmado en servidor.
- **Servicios externos:** Gmail SMTP mediante Nodemailer para verificación y recuperación de contraseña.

La organización se aproxima a una arquitectura por capas:

- **Presentación:** `*.html`, `css/styles.css`, `js/main.js`, `js/app.js`.
- **Controladores/API:** `api/*.js`.
- **Servicios compartidos:** `api/_lib/*.js`.
- **Persistencia:** Supabase/PostgreSQL, definido en `supabase_schema.sql`.

No se aplica MVC clásico de forma estricta porque no hay motor de vistas en servidor; sin embargo, existe separación clara entre interfaz, controladores API y capa de acceso a datos.

## Tecnologías

- HTML5.
- CSS3.
- JavaScript ES Modules.
- Node.js.
- Vercel Serverless Functions.
- Supabase.
- PostgreSQL.
- REST API.
- JWT con `jsonwebtoken`.
- bcrypt con `bcryptjs`.
- Nodemailer para SMTP.
- Docker para contenedorización local.

No se detectó uso real de:

- Next.js.
- React.
- TypeScript.
- Tailwind CSS.

## Estructura del proyecto

```text
infra-web/
  api/
    _lib/
      auth.js
      http.js
      mail.js
      password.js
      supabase.js
    contact.js
    forgot-password.js
    login.js
    logout.js
    profile.js
    register.js
    reset-password.js
    session.js
    verify-email.js
  css/
    styles.css
  docs/
    manual-usuario.md
    testing/
      pruebas-funcionales.md
  js/
    app.js
    main.js
  aviso-privacidad.html
  dashboard.html
  forgot_password.html
  index.html
  login.html
  politicas.html
  register.html
  reset_password.html
  verificar.html
  supabase_schema.sql
  vercel.json
  package.json
  Dockerfile
  docker-compose.yml
  .dockerignore
```

## Instalación local

1. Instala Node.js 18 o superior.
2. Instala dependencias:

```bash
npm install
```

3. Crea un archivo `.env` local con las variables necesarias.
4. Ejecuta el entorno local compatible con Vercel:

```bash
npm run dev
```

## Variables de entorno

```text
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
JWT_SECRET=clave_larga_y_segura
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu-correo@gmail.com
MAIL_PASSWORD=tu-password-de-aplicacion
MAIL_FROM_ADDRESS=tu-correo@gmail.com
MAIL_FROM_NAME=NEXCORE
```

`SUPABASE_SERVICE_ROLE_KEY` y `JWT_SECRET` son secretos de servidor. No deben exponerse en el navegador.

## Configuración de Supabase

1. Crea un proyecto en Supabase.
2. Abre SQL Editor.
3. Ejecuta `supabase_schema.sql`.
4. Configura las variables `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

Tablas incluidas:

- `users`
- `contact_messages`
- `password_resets`
- `remember_tokens`

Campos de seguridad destacados:

- `correo_verificado`
- `email_verification_token`
- `failed_login_attempts`
- `locked_until`
- `last_login_at`
- `session_expires_at`

## Administrador inicial

Después de registrarte y verificar tu correo, ejecuta en Supabase:

```sql
update public.users
set is_admin = true
where email = 'tu-correo@gmail.com';
```

Solo usuarios administradores con correo verificado pueden acceder al dashboard.

## APIs REST

Todas las APIs devuelven JSON.

| Ruta | Método | Descripción |
| --- | --- | --- |
| `/api/register` | `POST` | Registra usuarios, valida datos, hashea contraseña y envía correo de verificación. |
| `/api/login` | `POST` | Inicia sesión, valida contraseña, bloquea intentos fallidos y crea cookie JWT. |
| `/api/logout` | `POST` | Cierra sesión eliminando cookie. |
| `/api/session` | `GET` | Valida sesión activa y refresca ventana de inactividad. |
| `/api/profile` | `PUT` | Actualiza nombre, apellido o contraseña del usuario autenticado. |
| `/api/contact` | `POST` | Guarda mensajes del formulario de contacto. |
| `/api/forgot-password` | `POST` | Genera token temporal y envía correo de recuperación. |
| `/api/reset-password` | `POST` | Restablece contraseña y elimina token temporal. |
| `/api/verify-email` | `GET` | Verifica correo mediante token. |

Codigos HTTP usados:

- `200`: operación correcta.
- `201`: recurso creado.
- `400`: solicitud inválida o token inválido.
- `401`: no autenticado o credenciales inválidas.
- `403`: correo sin confirmar, bloqueo o permisos insuficientes.
- `409`: correo duplicado.
- `422`: error de validación.
- `500`: error interno o configuración faltante.

## Seguridad

Medidas existentes:

- Hash de contraseñas con bcrypt.
- Política de contraseña robusta en frontend y backend.
- Validación de datos en frontend y backend.
- JWT firmado con `JWT_SECRET`.
- Cookie `HttpOnly`, `Secure` y `SameSite=Lax`.
- Expiración por inactividad de 15 minutos.
- Bloqueo temporal por intentos fallidos.
- Verificación obligatoria de correo.
- Tokens temporales para recuperación de contraseña.
- Eliminación de tokens al completar recuperación.
- Protección de dashboard mediante `/api/session`.
- Consultas a Supabase a través de filtros estructurados, reduciendo riesgo de SQL Injection.
- Uso de `textContent` en mensajes dinámicos del frontend para reducir riesgo XSS.
- Variables de entorno para secretos.
- HTTPS provisto por Vercel en producción.

## SMTP Gmail

1. Activa verificación en dos pasos en Gmail.
2. Genera una contraseña de aplicación.
3. Configura `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS` y `MAIL_FROM_NAME`.
4. En producción no se muestran enlaces debug si SMTP falta.

## Docker

Construir imagen:

```bash
docker build -t nexcore-web .
```

Ejecutar con Docker Compose:

```bash
docker compose up --build
```

El contenedor expone el sitio en:

```text
http://localhost:3000
```

El contenedor usa Vercel CLI para conservar el comportamiento de rutas `/api`.

## Despliegue en Vercel

1. Sube el proyecto a un repositorio Git.
2. Importa el repositorio en Vercel.
3. Configura las variables de entorno.
4. Despliega.
5. Verifica que `index.html` cargue y que `/api/session` devuelva JSON.

## Dominio personalizado

1. En Vercel entra a Project Settings > Domains.
2. Agrega el dominio.
3. Configura los registros DNS indicados por Vercel.
4. Espera propagación DNS.
5. Confirma que HTTPS quede activo.

## Pruebas

La documentación de pruebas funcionales está en:

```text
docs/testing/pruebas-funcionales.md
```

Actualmente no se detectaron pruebas automatizadas configuradas en `package.json`.

## Manual de usuario

El manual para usuarios finales está en:

```text
docs/manual-usuario.md
```

## Notas de mantenimiento

- No exponer `SUPABASE_SERVICE_ROLE_KEY` en frontend.
- Ejecutar `supabase_schema.sql` al actualizar campos de seguridad.
- Mantener `JWT_SECRET` largo, privado y distinto entre ambientes.
- Ejecutar `migrations/20260719_project_management.sql` después de `supabase_schema.sql` para habilitar perfil, proyectos y tareas.

## Gestión de proyectos y tareas

Todo usuario con correo verificado puede acceder a su dashboard; `is_admin` se conserva para operaciones administrativas y no puede modificarse desde el frontend. El panel incluye perfil ampliado, métricas reales, CRUD de proyectos y tareas, Kanban, búsqueda con debounce y tema persistente.

La autenticación es propia (cookie JWT), no Supabase Auth. Las tablas privadas revocan acceso a `anon` y `authenticated`; las funciones Vercel usan la service role solo en servidor y validan sesión y `owner_id` en cada operación. Nunca expongas esa clave en el navegador.

APIs nuevas: `/api/dashboard`, `/api/projects` y `/api/tasks`. Ejecuta `npm test` y `npm run build`. Consulta `IMPLEMENTATION_REPORT.md` para las fases pendientes.
- Revisar periódicamente políticas de contraseña y bloqueo.
