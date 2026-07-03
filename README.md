# NEXCORE - Vercel + Supabase

Aplicacion web preparada para Vercel con frontend HTML/CSS/JS, APIs serverless en JavaScript dentro de `/api` y base de datos Supabase. No usa PHP ni XAMPP.

## Requisitos

- Node.js 18 o superior.
- Cuenta de Vercel.
- Proyecto de Supabase.
- Cuenta Gmail con contraseña de aplicacion si usaras SMTP real.

## Instalacion local

```bash
npm install
npm run dev
```

El comando `npm run dev` usa `vercel dev` para servir HTML y APIs serverless.

## Supabase

1. Crea un proyecto en Supabase.
2. Abre SQL Editor.
3. Ejecuta `supabase_schema.sql`.
4. Copia `Project URL`.
5. Copia `service_role key`.

Tablas usadas:

- `users`
- `contact_messages`
- `password_resets`
- `remember_tokens`

Campos de seguridad en `users`:

- `failed_login_attempts`
- `locked_until`
- `last_login_at`
- `session_expires_at`
- `correo_verificado`
- `email_verification_token`

## Variables de entorno en Vercel

Configura estas variables en Project Settings > Environment Variables:

```text
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
JWT_SECRET=usa_una_clave_larga_aleatoria
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu-correo@gmail.com
MAIL_PASSWORD=tu-password-de-aplicacion
MAIL_FROM_ADDRESS=tu-correo@gmail.com
MAIL_FROM_NAME=NEXCORE
```

`SUPABASE_SERVICE_ROLE_KEY` y `JWT_SECRET` son secretos de servidor. Nunca los pongas en JavaScript del navegador.

## Gmail SMTP

1. Activa la verificacion en dos pasos de tu cuenta Gmail.
2. Crea una contraseña de aplicacion.
3. Usa esa contraseña en `MAIL_PASSWORD`.
4. En produccion, si SMTP no esta configurado, el sistema no muestra enlaces debug.
5. En desarrollo local, si SMTP no esta configurado, las APIs pueden devolver un enlace debug para probar verificacion y recuperacion.

## Administrador

1. Registrate desde `register.html`.
2. Verifica tu correo.
3. En Supabase SQL Editor ejecuta:

```sql
update public.users
set is_admin = true
where email = 'tu-correo@gmail.com';
```

Solo usuarios con `is_admin = true` y correo verificado pueden iniciar sesion y acceder a `dashboard.html`.

## Seguridad implementada

- Contraseñas con bcrypt.
- Politica de contraseña:
  - minimo 8 caracteres
  - mayuscula
  - minuscula
  - numero
  - caracter especial
  - sin espacios
  - bloqueo de contraseñas debiles o consecutivas
- Validacion frontend y backend.
- Sesion con cookie `HttpOnly`, `Secure`, `SameSite=Lax`.
- Expiracion por inactividad de 15 minutos.
- Dashboard protegido por `/api/session`.
- Bloqueo temporal despues de varios intentos fallidos.
- Verificacion de correo obligatoria.
- Enlaces debug solo fuera de produccion.

## APIs

Todas las APIs responden JSON.

| Ruta | Metodo | Uso |
| --- | --- | --- |
| `/api/register` | `POST` | Registrar usuario y enviar verificacion |
| `/api/login` | `POST` | Iniciar sesion por correo y contraseña |
| `/api/logout` | `POST` | Cerrar sesion |
| `/api/session` | `GET` | Validar sesion y refrescar inactividad |
| `/api/profile` | `PUT` | Actualizar nombre, apellido o contraseña |
| `/api/contact` | `POST` | Guardar mensaje de contacto |
| `/api/forgot-password` | `POST` | Enviar enlace temporal de recuperacion |
| `/api/reset-password` | `POST` | Cambiar contraseña con token |
| `/api/verify-email` | `GET` | Confirmar correo con token |

Codigos usados:

- `200`: operacion correcta.
- `201`: registro creado.
- `400`: solicitud invalida o token invalido.
- `401`: no autenticado, correo no registrado o contraseña invalida.
- `403`: correo sin confirmar, cuenta bloqueada o usuario sin permisos.
- `409`: correo duplicado.
- `422`: validacion fallida.
- `500`: error interno o configuracion faltante.

## Despliegue en Vercel

1. Sube el proyecto a GitHub.
2. En Vercel, importa el repositorio.
3. Configura las variables de entorno.
4. Ejecuta el despliegue.
5. Verifica que `/api/session` responda JSON y que `index.html` cargue correctamente.

## Dominio personalizado

1. En Vercel entra a Project Settings > Domains.
2. Agrega tu dominio, por ejemplo `nexcore.com`.
3. Configura los registros DNS que Vercel indique:
   - `A` para dominio raiz, o
   - `CNAME` para subdominio como `www`.
4. Espera la propagacion DNS.
5. Confirma que Vercel emita HTTPS automaticamente.

## Pruebas recomendadas

1. Registro: crea una cuenta con contraseña fuerte.
2. Verificacion: confirma el correo desde el enlace recibido.
3. Admin: marca tu usuario como `is_admin = true`.
4. Login: prueba correo incorrecto, contraseña incorrecta y cuenta bloqueada.
5. Dashboard: entra, espera inactividad y confirma redireccion al login.
6. Perfil: cambia nombre, apellido y contraseña.
7. Recuperacion: solicita enlace y restablece contraseña.
8. Contacto: envia un mensaje desde `index.html` y revisa `contact_messages`.

## Archivos principales

- `index.html`: landing principal.
- `login.html`, `register.html`, `dashboard.html`: autenticacion y panel.
- `forgot_password.html`, `reset_password.html`, `verificar.html`: flujos de correo.
- `aviso-privacidad.html`, `politicas.html`: documentos legales.
- `js/app.js`: logica frontend de auth.
- `js/main.js`: interacciones de la landing.
- `api/_lib/*`: helpers compartidos.
- `api/*.js`: web services serverless.
- `supabase_schema.sql`: esquema de base de datos.
