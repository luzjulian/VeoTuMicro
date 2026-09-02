// src/services/mock/mockPerfilService.js

/**
 * Mock del servicio de perfil de usuario.
 * En producción, estas funciones consumen el backend (GET/PATCH /api/perfil)
 * que devuelve los datos del usuario autenticado según el token JWT.
 * El frontend solo dispara la llamada y recibe/actualiza el objeto usuario.
 */

const PERFIL_MOCK = {
  rol: "pasajero", // "pasajero" | "conductor" | "admin"
  nombre: "Juan Pablo Díaz Rodríguez",
  dni: "40.123.456",
  email: "juan.diaz@gmail.com",
  telefono: "+54 221 555 1234",
  fechaRegistro: "12 de abril de 2024",
  certificado: {
    nombreArchivo: "certificado_juan_diaz.pdf",
    fechaCarga: "12/04/2024",
    url: "/mock/certificado.pdf",
  },
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Estado en memoria para simular persistencia entre llamadas dentro de la misma sesión.
let perfilActual = { ...PERFIL_MOCK };

export async function getPerfil() {
  await delay(300);
  return perfilActual;
}

// Los datos editables desde la vista de Perfil son nombre, email y teléfono.
// El DNI, rol, fechaRegistro y certificado no se modifican desde acá.
export async function actualizarPerfil({ nombre, email, telefono }) {
  await delay(400);
  perfilActual = { ...perfilActual, nombre, email, telefono };
  return perfilActual;
}