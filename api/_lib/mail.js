import nodemailer from 'nodemailer';

function configured() {
  return process.env.MAIL_USERNAME && process.env.MAIL_PASSWORD;
}

export function isProduction() {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildVerificationEmailTemplate({ userName, verificationUrl, currentYear, supportEmail }) {
  const safeName = escapeHtml(userName || 'usuario');
  const safeUrl = escapeHtml(verificationUrl);
  const safeSupportEmail = supportEmail ? escapeHtml(supportEmail) : '';
  const supportBlock = safeSupportEmail
    ? `<p style="margin:16px 0 0;color:#64748b;font-size:14px;line-height:1.6;">Si necesitas ayuda, puedes escribir a <a href="mailto:${safeSupportEmail}" style="color:#2563eb;text-decoration:none;">${safeSupportEmail}</a>.</p>`
    : '';
  const supportText = supportEmail ? `\nSoporte: ${supportEmail}` : '';

  return {
    subject: 'Verifica tu cuenta de NextCore',
    html: `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verifica tu cuenta de NextCore</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;margin:0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;box-shadow:0 12px 30px rgba(15,23,42,0.12);overflow:hidden;">
            <tr>
              <td style="background:#0b1120;padding:28px 32px;text-align:center;">
                <div style="color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px;">Next<span style="color:#3b82f6;">Core</span></div>
                <div style="color:#93c5fd;font-size:13px;margin-top:8px;">Acceso seguro a tu plataforma</div>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 32px;">
                <h1 style="margin:0 0 18px;color:#0f172a;font-size:26px;line-height:1.25;">Bienvenido a NextCore</h1>
                <p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:1.65;">Hola, <strong>${safeName}</strong>:</p>
                <p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:1.65;">Gracias por registrarte en NextCore. Para completar la creación de tu cuenta y acceder de forma segura a la plataforma, verifica tu dirección de correo electrónico.</p>
                <p style="margin:0 0 24px;color:#334155;font-size:16px;line-height:1.65;">NextCore es una plataforma web para presentar servicios de infraestructura tecnológica y operar un panel privado de usuarios autorizados dentro de un entorno moderno y protegido.</p>
                <div style="text-align:center;margin:30px 0;">
                  <a href="${safeUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 26px;border-radius:10px;">Verificar mi cuenta</a>
                </div>
                <p style="margin:0 0 10px;color:#64748b;font-size:14px;line-height:1.6;">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
                <p style="margin:0 0 24px;word-break:break-all;color:#2563eb;font-size:14px;line-height:1.6;"><a href="${safeUrl}" style="color:#2563eb;">${safeUrl}</a></p>
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin:24px 0;">
                  <p style="margin:0;color:#1e3a8a;font-size:14px;line-height:1.6;"><strong>Aviso de seguridad:</strong> Por tu seguridad, no compartas este correo ni el enlace de verificación. Si tú no creaste esta cuenta, puedes ignorar este mensaje.</p>
                </div>
                ${supportBlock}
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:22px 32px;text-align:center;">
                <p style="margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.5;">© ${currentYear} NextCore. Todos los derechos reservados.</p>
                <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">Este es un mensaje automático; por favor, no respondas a este correo.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: `Bienvenido a NextCore

Hola, ${userName || 'usuario'}:

Gracias por registrarte en NextCore. Para completar la creación de tu cuenta y acceder de forma segura a la plataforma, verifica tu dirección de correo electrónico.

NextCore es una plataforma web para presentar servicios de infraestructura tecnológica y operar un panel privado de usuarios autorizados dentro de un entorno moderno y protegido.

Verificar mi cuenta:
${verificationUrl}

Si el botón no funciona, copia y pega el enlace anterior en tu navegador.

Aviso de seguridad: no compartas este correo ni el enlace de verificación. Si tú no creaste esta cuenta, puedes ignorar este mensaje.${supportText}

© ${currentYear} NextCore. Todos los derechos reservados.
Este es un mensaje automático; por favor, no respondas a este correo.`
  };
}

async function deliver(to, name, subject, html, text = '') {
  if (!configured()) {
    if (isProduction()) throw new Error('SMTP no esta configurado en produccion.');
    return { mode: 'debug' };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT || 587),
    secure: false,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD
    }
  });

  await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME || 'NEXCORE'}" <${process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME}>`,
    to: `"${name}" <${to}>`,
    subject,
    html,
    text
  });

  return { mode: 'smtp' };
}

export async function sendVerificationEmail(to, name, link) {
  const template = buildVerificationEmailTemplate({
    userName: name?.trim(),
    verificationUrl: link,
    currentYear: new Date().getFullYear(),
    supportEmail: process.env.MAIL_SUPPORT_EMAIL || process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME
  });

  return deliver(to, name || 'usuario', template.subject, template.html, template.text);
}

export async function sendPasswordResetEmail(to, name, link) {
  return deliver(to, name, 'Restablece tu contraseña en NEXCORE', `
    <h2>Restablecer contraseña</h2>
    <p>Hola ${name}, usa este enlace temporal para crear una nueva contraseña.</p>
    <p><a href="${link}">Crear nueva contraseña</a></p>
    <p>${link}</p>
  `, `Restablecer contraseña

Hola ${name}, usa este enlace temporal para crear una nueva contraseña:
${link}`);
}
