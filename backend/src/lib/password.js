const bcrypt = require('bcrypt');

// Único lugar del proyecto que sabe de bcrypt: el resto solo llama a
// hashPassword/verifyPassword, así el algoritmo se puede cambiar acá sin tocar nada más.

// 12 es un piso razonable en 2026: lento para fuerza bruta, tolerable en login.
const SALT_ROUNDS = 12;

/**
 * bcrypt guarda el salt dentro del propio hash, no hay que administrarlo aparte.
 * Por eso hashear la misma contraseña dos veces da resultados DISTINTOS,
 * lo que evita ataques con rainbow tables precomputadas.
 */
const hashPassword = (plainText) => bcrypt.hash(plainText, SALT_ROUNDS);

/**
 * bcrypt.compare corre en tiempo aproximadamente constante.
 * Nunca comparar hashes con === porque eso es vulnerable a timing attacks.
 */
const verifyPassword = (plainText, hash) => bcrypt.compare(plainText, hash);

module.exports = { hashPassword, verifyPassword };