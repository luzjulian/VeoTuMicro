// backend/src/domain/persona.js
//
// Persona y SolicitudRegistro guardan nombre y apellido por separado.
// Donde hace falta un solo texto (mails, viajes) se arma acá.

const nombreCompleto = (p) => [p?.nombre, p?.apellido].filter(Boolean).join(' ');

module.exports = { nombreCompleto };
