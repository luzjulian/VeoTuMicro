// src/lib/platform.js

/**
 * Detecta iOS Safari, donde la Web Speech API exige interacción táctil
 * explícita antes de poder escuchar el micrófono.
 */
export function isIOSSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  return isIOS && isSafari;
}
