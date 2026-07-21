# Reporte de implementación — NEXCORE

## Estado inicial

Aplicación HTML/CSS/JavaScript con funciones Vercel, Supabase REST, JWT HttpOnly, bcrypt y Gmail SMTP. Ya existían registro, login, logout, perfil básico, verificación, recuperación, bloqueo de intentos y caducidad. El login bloqueaba a usuarios no administradores.

## Implementado

- Acceso privado para usuarios verificados y separación `requireUser`/`requireAdmin`.
- Perfil ampliado; proyectos y tareas con restricciones, índices y triggers.
- RLS habilitado, acceso público revocado y service role solo en backend.
- APIs CRUD con validación de sesión y propietario.
- Dashboard responsive, métricas reales, CRUD de proyectos y Kanban de tareas.
- Búsqueda con debounce, estados vacíos, confirmaciones y tema persistente.
- Pruebas de contraseña y contratos de autorización/RLS.

## Despliegue

Ejecutar `supabase_schema.sql` y luego `migrations/20260719_project_management.sql`. Mantener `SUPABASE_SERVICE_ROLE_KEY` y `JWT_SECRET` solo en Vercel.

## Pendiente

Miembros y roles por proyecto, comentarios, actividad, Storage, calendario, notificaciones y administración. No se muestran funciones simuladas. RLS ligada a identidad requeriría migrar a Supabase Auth; esta versión conserva la autenticación actual y autoriza en backend.
