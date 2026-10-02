// backend/prisma/seed.js
// Ejecutar con: npx prisma db seed
// (o manualmente: node prisma/seed.js)

require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const hashPwd = (pwd) => bcrypt.hashSync(pwd, 10);

// Mismo directorio que usa el backend para los certificados (UPLOADS_DIR).
const UPLOADS_DIR = path.resolve(process.cwd(), process.env.UPLOADS_DIR || './uploads/certificados');

// Arma un PDF mínimo pero válido (una página con un texto) para tener certificados de ejemplo.
const construirPdf = (texto) => {
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    null, // contenido (se arma abajo)
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const contenido = `BT /F1 20 Tf 60 780 Td (${texto.replace(/[()\\]/g, '')}) Tj ET`;
  objetos[3] = `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`;

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objetos.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => { pdf += `${String(off).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
};

const guardarPdfDeEjemplo = (texto) => {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const clave = `${crypto.randomUUID()}.pdf`;
  fs.writeFileSync(path.join(UPLOADS_DIR, clave), construirPdf(texto));
  return clave;
};

// ---------------------------------------------------------------------------
// Datos de referencia
// ---------------------------------------------------------------------------

// Las 3 líneas que cubre el mock proximosArribos.json.
// Nota: Persona.dni es @unique en el schema — los DNIs de esta lista no deben repetirse.
const LINEAS = [
  { nroLinea: '307', ramal: 'A' },
  { nroLinea: '214', ramal: 'D' },
  { nroLinea: '202', ramal: 'B' },
];

// Paradas distribuidas ~300 m alrededor de la ubicación de desarrollo.
// P001 coincide con la ubicación GPS del tester → siempre será la "más cercana".
// nroParada debe coincidir con las keys de proximosArribos.json
// Dos grupos de paradas, uno por cada ubicación de testeo.
// Dentro de cada grupo, la parada "exacta" tiene las 3 líneas (happy path)
// y las adyacentes tienen líneas limitadas para probar el modal de error.
//
// Grupo 1 — ubicación 1 (-34.756477, -58.275477)
//   P001 → en el punto exacto  → 307-A, 214-D, 202-B
//   P002 → ~300 m al sur       → 307-A, 214-D        (202-B falla → error modal)
//
// Grupo 2 — ubicación 2 (-34.903712, -57.924803)
//   P003 → en el punto exacto  → 307-A, 214-D, 202-B
//   P004 → ~300 m al sur       → 307-A               (214-D y 202-B fallan)
//   P005 → ~300 m al oeste     → 214-D, 202-B        (307-A falla)
const PARADAS = [
  { nroParada: '0001', latitud: -34.756477, longitud: -58.275477 }, // ubicación 1 — exacta
  { nroParada: '0002', latitud: -34.759177, longitud: -58.275477 }, // ubicación 1 — ~300 m sur
  { nroParada: '0003', latitud: -34.903712, longitud: -57.924803 }, // ubicación 2 — exacta
  { nroParada: '0004', latitud: -34.906412, longitud: -57.924803 }, // ubicación 2 — ~300 m sur
  { nroParada: '0005', latitud: -34.903712, longitud: -57.928003 }, // ubicación 2 — ~300 m oeste
];

// Choferes — los DNI deben coincidir con proximosArribos.json y ser únicos en Persona
const CHOFERES_DATA = [
  {
    dni: '30111222',
    nombreApellido: 'Carlos Rodríguez',
    fechaNacimiento: new Date('1985-03-15'),
    nroLicenciaConducir: 'LC-001-ARG',
    nombreUsuario: 'chofer.carlos',
    email: 'chofer.carlos@veotumicro.test',
    password: 'chofer1234',
    lineaIdx: 0, // 307-A
  },
  {
    dni: '30333444',
    nombreApellido: 'Mario Fernández',
    fechaNacimiento: new Date('1979-07-22'),
    nroLicenciaConducir: 'LC-002-ARG',
    nombreUsuario: 'chofer.mario',
    email: 'chofer.mario@veotumicro.test',
    password: 'chofer1234',
    lineaIdx: 0, // 307-A
  },
  {
    dni: '30555666',
    nombreApellido: 'Lucas Gómez',
    fechaNacimiento: new Date('1990-11-30'),
    nroLicenciaConducir: 'LC-003-ARG',
    nombreUsuario: 'chofer.lucas',
    email: 'chofer.lucas@veotumicro.test',
    password: 'chofer1234',
    lineaIdx: 1, // 214-D
  },
  {
    dni: '30777888',
    nombreApellido: 'Pedro Martínez',
    fechaNacimiento: new Date('1982-06-10'),
    nroLicenciaConducir: 'LC-004-ARG',
    nombreUsuario: 'chofer.pedro',
    email: 'chofer.pedro@veotumicro.test',
    password: 'chofer1234',
    lineaIdx: 1, // 214-D
  },
  {
    dni: '30999000',
    nombreApellido: 'Jorge López',
    fechaNacimiento: new Date('1975-01-05'),
    nroLicenciaConducir: 'LC-005-ARG',
    nombreUsuario: 'chofer.jorge',
    email: 'chofer.jorge@veotumicro.test',
    password: 'chofer1234',
    lineaIdx: 2, // 202-B
  },
  {
    dni: '30888111',
    nombreApellido: 'Roberto Díaz',
    fechaNacimiento: new Date('1988-09-14'),
    nroLicenciaConducir: 'LC-006-ARG',
    nombreUsuario: 'chofer.roberto',
    email: 'chofer.roberto@veotumicro.test',
    password: 'chofer1234',
    lineaIdx: 2, // 202-B
  },
];

const ADMIN_DATA = {
  dni: '20111222',
  nombreApellido: 'Administrativa Principal',
  fechaNacimiento: new Date('1980-04-20'),
  legajo: 'ADM-001',
  nombreUsuario: 'admin.jefe',
  email: 'admin@veotumicro.test',
  password: 'admin1234',
};

const PASAJEROS_DATA = [
  {
    dni: '25111222',
    nombreApellido: 'Ana García',
    fechaNacimiento: new Date('1995-08-12'),
    certificadoDiscapacidad: 'CERT-VIS-001',
    nombreUsuario: 'pasajero.ana',
    email: 'ana@veotumicro.test',
    password: 'pasajero1234',
  },
  {
    dni: '25333444',
    nombreApellido: 'María Pérez',
    fechaNacimiento: new Date('2000-02-28'),
    certificadoDiscapacidad: 'CERT-VIS-002',
    nombreUsuario: 'pasajero.maria',
    email: 'maria@veotumicro.test',
    password: 'pasajero1234',
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('🌱 Iniciando seed...\n');

  // 1. Limpiar en orden inverso de dependencias
  console.log('🧹 Limpiando BD...');
  await prisma.viaje.deleteMany();
  await prisma.solicitudRegistro.deleteMany();
  await prisma.conduce.deleteMany();
  await prisma.paradaAscenso.deleteMany();
  await prisma.linea.deleteMany();
  await prisma.pasajero.deleteMany();
  await prisma.chofer.deleteMany();
  await prisma.administrativo.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.cuenta.deleteMany();
  await prisma.persona.deleteMany();

  // 2. Líneas
  console.log('🚌 Creando líneas...');
  const lineas = await Promise.all(
    LINEAS.map((l) => prisma.linea.create({ data: l }))
  );
  lineas.forEach((l) => console.log(`   Línea ${l.nroLinea}-${l.ramal} (oid: ${l.oid})`));

  // 3. Paradas
  console.log('\n🗺️  Creando paradas...');
  const paradas = await Promise.all(
    PARADAS.map((p) => prisma.paradaAscenso.create({ data: p }))
  );
  paradas.forEach((p) => console.log(`   Parada ${p.nroParada} (oid: ${p.oid})`));

  // 4. Administrativo
  console.log('\n👔 Creando administrativo...');
  const personaAdmin = await prisma.persona.create({
    data: {
      dni:             ADMIN_DATA.dni,
      nombreApellido:  ADMIN_DATA.nombreApellido,
      fechaNacimiento: ADMIN_DATA.fechaNacimiento,
      email:           ADMIN_DATA.email,
    },
  });
  const adminRol = await prisma.administrativo.create({
    data: { legajo: ADMIN_DATA.legajo, personaOid: personaAdmin.oid },
  });
  await prisma.cuenta.create({
    data: {
      dni:          ADMIN_DATA.dni,
      nombreUsuario: ADMIN_DATA.nombreUsuario,
      contrasenia:  hashPwd(ADMIN_DATA.password),
      personaOid:   personaAdmin.oid,
    },
  });
  console.log(`   ${ADMIN_DATA.nombreApellido} → usuario: ${ADMIN_DATA.nombreUsuario} / pass: ${ADMIN_DATA.password}`);

  // 5. Pasajeros
  console.log('\n🧑 Creando pasajeros...');
  for (const p of PASAJEROS_DATA) {
    const persona = await prisma.persona.create({
      data: {
        dni:             p.dni,
        nombreApellido:  p.nombreApellido,
        fechaNacimiento: p.fechaNacimiento,
        email:           p.email,
      },
    });
    await prisma.pasajero.create({
      data: {
        certificadoDiscapacidad: p.certificadoDiscapacidad,
        personaOid:              persona.oid,
        adminOid:                adminRol.oid, // validado por el admin
      },
    });
    await prisma.cuenta.create({
      data: {
        dni:          p.dni,
        nombreUsuario: p.nombreUsuario,
        contrasenia:  hashPwd(p.password),
        personaOid:   persona.oid,
      },
    });
    console.log(`   ${p.nombreApellido} → usuario: ${p.nombreUsuario} / pass: ${p.password}`);
  }

  // 6. Choferes + Conduce activos
  console.log('\n🚗 Creando choferes y conduce activos...');
  const ahora = new Date();

  for (const c of CHOFERES_DATA) {
    const persona = await prisma.persona.create({
      data: {
        dni:             c.dni,
        nombreApellido:  c.nombreApellido,
        fechaNacimiento: c.fechaNacimiento,
        email:           c.email,
      },
    });
    const chofer = await prisma.chofer.create({
      data: {
        nroLicenciaConducir: c.nroLicenciaConducir,
        personaOid:          persona.oid,
      },
    });
    await prisma.cuenta.create({
      data: {
        dni:          c.dni,
        nombreUsuario: c.nombreUsuario,
        contrasenia:  hashPwd(c.password),
        personaOid:   persona.oid,
      },
    });

    // Conduce activo (fechaHoraFin = null)
    const conduce = await prisma.conduce.create({
      data: {
        fechaHoraInicio: ahora,
        fechaHoraFin:    null,
        choferOid:       chofer.oid,
        lineaOid:        lineas[c.lineaIdx].oid,
      },
    });

    console.log(
      `   ${c.nombreApellido} (DNI: ${c.dni}) → Línea ${lineas[c.lineaIdx].nroLinea}-${lineas[c.lineaIdx].ramal} | usuario: ${c.nombreUsuario} | conduceOid: ${conduce.oid}`
    );
  }

  // 7. Solicitudes de registro de ejemplo (para probar el panel administrativo)
  console.log('\n📄 Creando solicitudes de registro de ejemplo...');
  const HACE = (min) => new Date(Date.now() - min * 60 * 1000);
  const SOLICITUDES_DATA = [
    { nombreApellido: 'Marina García',  dni: '34901567', email: 'marina@veotumicro.test', estado: 'PENDIENTE', createdAt: HACE(120) },
    { nombreApellido: 'Diego Romero',   dni: null,       email: 'diego@veotumicro.test',  estado: 'PENDIENTE', createdAt: HACE(45) },
    { nombreApellido: 'Andrés Pérez',   dni: '34612445', email: 'andres@veotumicro.test', estado: 'RECHAZADA', createdAt: HACE(60 * 48) },
  ];
  for (const sol of SOLICITUDES_DATA) {
    await prisma.solicitudRegistro.create({
      data: {
        nombreApellido:    sol.nombreApellido,
        dni:               sol.dni,
        email:             sol.email,
        contraseniaHash:   hashPwd('pasajero1234'),
        certificadoKey:    guardarPdfDeEjemplo(`Certificado de ejemplo - ${sol.nombreApellido}`),
        certificadoNombre: 'certificado.pdf',
        estado:            sol.estado,
        createdAt:         sol.createdAt,
        ...(sol.estado === 'RECHAZADA' ? { resueltaAt: HACE(60 * 47), adminOid: adminRol.oid } : {}),
      },
    });
    console.log(`   ${sol.nombreApellido} → ${sol.estado} (${sol.email})`);
  }

  console.log('\n✅ Seed completado con éxito!');
  console.log('\n📋 Resumen de credenciales:');
  console.log('   Admin:    admin@veotumicro.test (o admin.jefe) / admin1234');
  console.log('   Pasajeros: ana@veotumicro.test, maria@veotumicro.test (o pasajero.ana, pasajero.maria) / pasajero1234');
  console.log('   Choferes:  chofer.carlos, chofer.mario, chofer.lucas,');
  console.log('              chofer.pedro, chofer.jorge, chofer.roberto / chofer1234');
  console.log('   Los choferes también entran con <usuario>@veotumicro.test');
  console.log('   Solicitudes de ejemplo: 2 pendientes (Marina, Diego) y 1 rechazada (Andrés).');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());