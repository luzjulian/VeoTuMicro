// backend/src/services/mail.service.js
//
// Envío de mails con nodemailer.
//   - Con SMTP_HOST configurado (Mailtrap en desarrollo, SMTP real en producción) el mail se envía.
//   - Sin SMTP_HOST (solo permitido fuera de producción) NO se envía: se imprime en consola.

const nodemailer = require('nodemailer');
const { env } = require('../config/env');

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = env.SMTP_HOST
    ? nodemailer.createTransport({
        host:   env.SMTP_HOST,
        port:   env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth:   env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      })
    : nodemailer.createTransport({ jsonTransport: true });

  return transporter;
};

// El nombre lo escribe el usuario: se escapa antes de meterlo en el HTML del mail.
const escapeHtml = (texto) =>
  String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const enviar = async ({ to, subject, text, html }) => {
  const info = await getTransporter().sendMail({ from: env.MAIL_FROM, to, subject, text, html });

  if (!env.SMTP_HOST) {
    console.log(`[mail:dev] SMTP_HOST no configurado, el mail no se envía. Para: ${to} | Asunto: ${subject}\n${text}\n`);
  }
  return info;
};

const enviarAprobacion = ({ email, nombre }) =>
  enviar({
    to: email,
    subject: 'Tu cuenta de VeoTuMicro fue aprobada',
    text:
      `Hola ${nombre},\n\n` +
      'Validamos tu certificado de discapacidad y tu cuenta ya está activa.\n' +
      `Ya podés iniciar sesión en ${env.APP_URL} con tu email (${email}) y la contraseña que elegiste al registrarte.\n\n` +
      'Equipo VeoTuMicro',
    html:
      `<p>Hola ${escapeHtml(nombre)},</p>` +
      '<p>Validamos tu certificado de discapacidad y tu cuenta ya está activa.</p>' +
      `<p>Ya podés iniciar sesión en <a href="${escapeHtml(env.APP_URL)}">${escapeHtml(env.APP_URL)}</a> ` +
      `con tu email (<strong>${escapeHtml(email)}</strong>) y la contraseña que elegiste al registrarte.</p>` +
      '<p>Equipo VeoTuMicro</p>',
  });

const enviarRechazo = ({ email, nombre }) =>
  enviar({
    to: email,
    subject: 'No pudimos validar tu solicitud en VeoTuMicro',
    text:
      `Hola ${nombre},\n\n` +
      'No pudimos validar tu certificado de discapacidad, por eso tu solicitud no fue aprobada.\n' +
      'Podés volver a realizar el trámite registrándote de nuevo y adjuntando un certificado válido en PDF.\n\n' +
      'Equipo VeoTuMicro',
    html:
      `<p>Hola ${escapeHtml(nombre)},</p>` +
      '<p>No pudimos validar tu certificado de discapacidad, por eso tu solicitud no fue aprobada.</p>' +
      '<p>Podés volver a realizar el trámite registrándote de nuevo y adjuntando un certificado válido en PDF.</p>' +
      '<p>Equipo VeoTuMicro</p>',
  });

module.exports = { enviarAprobacion, enviarRechazo };
