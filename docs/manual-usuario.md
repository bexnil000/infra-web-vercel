# Manual de usuario - NEXCORE

## Introducción

NEXCORE es una aplicación web para presentar servicios de infraestructura tecnológica y administrar un panel privado para usuarios autorizados. El sitio permite registro, verificación de correo, inicio de sesión, recuperación de contraseña y edición básica del perfil.

## Requisitos

- Navegador web actualizado.
- Conexión a internet.
- Correo electrónico válido.
- Cuenta previamente autorizada como administradora para ingresar al dashboard.

## Registro

1. Abre `register.html`.
2. Ingresa nombre, apellido, correo electrónico y contraseña.
3. Confirma la contraseña.
4. Usa una contraseña segura con mayúscula, minúscula, número y carácter especial.
5. Envía el formulario.
6. Revisa tu correo para confirmar la cuenta.

## Inicio de sesión

1. Abre `login.html`.
2. Escribe tu correo y contraseña.
3. Opcionalmente activa `Recordar usuario`.
4. Pulsa `Iniciar sesión`.
5. Si tu cuenta está verificada y tiene permisos, entrarás al dashboard.

## Recuperación de contraseña

1. En la pantalla de login, selecciona `Olvidé mi contraseña`.
2. Ingresa tu correo registrado.
3. Revisa tu correo y abre el enlace temporal.
4. Escribe una nueva contraseña segura.
5. Confirma la nueva contraseña.
6. Vuelve a iniciar sesión.

## Verificación de correo

Después del registro recibirás un enlace de verificación. Al abrirlo, el sistema activará tu correo y mostrará un mensaje de confirmación. No podrás iniciar sesión hasta completar este paso.

## Uso del Dashboard

El dashboard muestra:

- Nombre del usuario.
- Correo registrado.
- Fecha de registro.

También permite actualizar:

- Nombre.
- Apellido.
- Contraseña.

Para cambiar la contraseña debes escribir la contraseña actual y una nueva contraseña segura.

## Cerrar sesión

Desde `dashboard.html`, pulsa `Cerrar sesión`. El sistema cerrará tu sesión y volverá a la página principal.

## Preguntas frecuentes

**¿Por qué no puedo iniciar sesión?**  
Puede que el correo no esté verificado, que la contraseña sea incorrecta o que tu cuenta no tenga permisos de administrador.

**¿Qué pasa si fallo muchas veces la contraseña?**  
La cuenta se bloquea temporalmente por seguridad. Espera unos minutos antes de intentar de nuevo.

**¿Por qué me envía al login mientras uso el dashboard?**  
La sesión expira por inactividad después de 15 minutos.

**¿Qué hago si no recibo correos?**  
Revisa la carpeta de spam. Si el problema continúa, contacta al administrador del sistema.

**¿Puedo usar una contraseña simple?**  
No. El sistema exige una contraseña robusta para proteger la cuenta.
