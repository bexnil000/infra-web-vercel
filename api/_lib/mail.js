import nodemailer from 'nodemailer';

function configured() {
  return process.env.MAIL_USERNAME && process.env.MAIL_PASSWORD;
}

export function isProduction() {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}

async function deliver(to, name, subject, html) {
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
    html
  });

  return { mode: 'smtp' };
}

export async function sendVerificationEmail(to, name, link) {
  return deliver(to, name, 'Confirma tu correo en NEXCORE', `
    <h2>Confirma tu correo</h2>
    <p>Hola ${name}, gracias por registrarte en NEXCORE.</p>
    <p><a href="${link}">Verificar correo</a></p>
    <p>${link}</p>
  `);
}

export async function sendPasswordResetEmail(to, name, link) {
  return deliver(to, name, 'Restablece tu contraseña en NEXCORE', `
    <h2>Restablecer contraseña</h2>
    <p>Hola ${name}, usa este enlace temporal para crear una nueva contraseña.</p>
    <p><a href="${link}">Crear nueva contraseña</a></p>
    <p>${link}</p>
  `);
}

