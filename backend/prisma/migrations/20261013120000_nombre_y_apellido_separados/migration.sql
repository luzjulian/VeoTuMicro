-- Unifica el nombre en dos columnas (nombre, apellido) y elimina "nombreApellido".
-- Los datos existentes se conservan: apellido = última palabra, nombre = el resto.

-- ─── Persona ────────────────────────────────────────────────────────────────
ALTER TABLE "Persona" ADD COLUMN "nombre" TEXT, ADD COLUMN "apellido" TEXT;

UPDATE "Persona" SET
  "nombre" = CASE WHEN btrim("nombreApellido") ~ '\s'
                  THEN regexp_replace(btrim("nombreApellido"), '\s+\S+$', '')
                  ELSE btrim("nombreApellido") END,
  "apellido" = CASE WHEN btrim("nombreApellido") ~ '\s'
                    THEN substring(btrim("nombreApellido") from '\S+$')
                    ELSE '' END;

ALTER TABLE "Persona" ALTER COLUMN "nombre" SET NOT NULL, ALTER COLUMN "apellido" SET NOT NULL;
ALTER TABLE "Persona" DROP COLUMN "nombreApellido";

-- ─── SolicitudRegistro ──────────────────────────────────────────────────────
-- Las filas que ya tenían nombre y apellido separados no se tocan.
UPDATE "SolicitudRegistro" SET
  "nombre" = CASE WHEN btrim("nombreApellido") ~ '\s'
                  THEN regexp_replace(btrim("nombreApellido"), '\s+\S+$', '')
                  ELSE btrim("nombreApellido") END,
  "apellido" = CASE WHEN btrim("nombreApellido") ~ '\s'
                    THEN substring(btrim("nombreApellido") from '\S+$')
                    ELSE '' END
WHERE "nombre" IS NULL OR "apellido" IS NULL;

ALTER TABLE "SolicitudRegistro" ALTER COLUMN "nombre" SET NOT NULL, ALTER COLUMN "apellido" SET NOT NULL;
ALTER TABLE "SolicitudRegistro" DROP COLUMN "nombreApellido";
