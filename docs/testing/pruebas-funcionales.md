# Pruebas funcionales - NEXCORE

Este documento registra pruebas funcionales manuales para validar los flujos principales del proyecto. No se encontraron pruebas automatizadas existentes en el repositorio, por lo que se documentan casos manuales mínimos para la rúbrica.

| Caso de prueba | Descripción | Resultado esperado | Resultado obtenido |
| --- | --- | --- | --- |
| Registro válido | Completar `register.html` con nombre, apellido, correo no registrado y contraseña fuerte. | La API `/api/register` responde `201`, crea el usuario con contraseña bcrypt y solicita verificación por correo. | Pendiente de ejecutar en entorno con Supabase configurado. |
| Registro con correo duplicado | Registrar un correo ya existente. | La API responde `409` con mensaje de correo ya registrado. | Pendiente de ejecutar en entorno con Supabase configurado. |
| Registro con contraseña débil | Usar contraseñas como `12345678`, `abc12345` o sin carácter especial. | Frontend y backend bloquean el envío con mensaje de política de contraseña. | Pendiente de ejecutar en entorno con Supabase configurado. |
| Login válido | Iniciar sesión con correo verificado, contraseña correcta y usuario administrador. | La API `/api/login` responde `200`, crea cookie `HttpOnly` y redirige a `dashboard.html`. | Pendiente de ejecutar en entorno con Supabase configurado. |
| Login con correo no registrado | Enviar un correo inexistente. | La API responde `401` con mensaje `Correo no registrado.` | Pendiente de ejecutar en entorno con Supabase configurado. |
| Login con contraseña inválida | Usar correo existente y contraseña incorrecta. | La API responde `401`, incrementa intentos fallidos y muestra intentos restantes. | Pendiente de ejecutar en entorno con Supabase configurado. |
| Bloqueo temporal | Fallar contraseña varias veces hasta superar el límite. | La API responde `403` y bloquea temporalmente la cuenta con `locked_until`. | Pendiente de ejecutar en entorno con Supabase configurado. |
| Verificación de correo | Abrir `verificar.html?token=TOKEN_VALIDO`. | La API `/api/verify-email` marca `correo_verificado = true` y muestra mensaje de éxito. | Pendiente de ejecutar en entorno con Supabase configurado. |
| Verificación con token usado | Abrir un token ya usado o inválido. | La API responde `400` con mensaje de enlace inválido o usado. | Pendiente de ejecutar en entorno con Supabase configurado. |
| Recuperación de contraseña | Solicitar recuperación desde `forgot_password.html` con correo verificado. | Se crea token temporal en `password_resets` y se envía enlace por SMTP. | Pendiente de ejecutar en entorno con Supabase configurado. |
| Restablecer contraseña | Abrir `reset_password.html?token=TOKEN_VALIDO` y enviar contraseña fuerte. | La API actualiza la contraseña con bcrypt y elimina el token temporal. | Pendiente de ejecutar en entorno con Supabase configurado. |
| Cierre de sesión | Pulsar `Cerrar sesión` desde dashboard. | La API `/api/logout` elimina cookie y redirige a `index.html`. | Pendiente de ejecutar en entorno con Supabase configurado. |
| Protección de rutas | Abrir `dashboard.html` sin cookie de sesión. | El frontend consulta `/api/session`; si falla, redirige a `login.html?expired=1`. | Pendiente de ejecutar en entorno con Supabase configurado. |
| Expiración por inactividad | Iniciar sesión y no interactuar durante 15 minutos. | El frontend cierra sesión y redirige al login con mensaje de expiración. | Pendiente de ejecutar en entorno con Supabase configurado. |
| Validaciones de contacto | Enviar formulario de contacto con datos incompletos o email inválido. | Frontend/backend responden con mensajes de validación y no insertan datos inválidos. | Pendiente de ejecutar en entorno con Supabase configurado. |
| Manejo de errores API | Enviar método HTTP no permitido a una API. | La API responde `405` en JSON con mensaje `Metodo no permitido.` | Pendiente de ejecutar en entorno con Supabase configurado. |
