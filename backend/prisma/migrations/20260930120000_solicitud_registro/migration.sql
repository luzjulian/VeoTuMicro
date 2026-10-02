-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA');

-- AlterTable
ALTER TABLE "Cuenta" ALTER COLUMN "dni" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Persona" ADD COLUMN     "email" TEXT,
ALTER COLUMN "dni" DROP NOT NULL,
ALTER COLUMN "fechaNacimiento" DROP NOT NULL;

-- CreateTable
CREATE TABLE "SolicitudRegistro" (
    "oid" SERIAL NOT NULL,
    "nombreApellido" TEXT NOT NULL,
    "dni" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "email" TEXT NOT NULL,
    "contraseniaHash" TEXT NOT NULL,
    "certificadoKey" TEXT NOT NULL,
    "certificadoNombre" TEXT NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resueltaAt" TIMESTAMP(3),
    "adminOid" INTEGER,

    CONSTRAINT "SolicitudRegistro_pkey" PRIMARY KEY ("oid")
);

-- CreateIndex
CREATE INDEX "SolicitudRegistro_estado_createdAt_idx" ON "SolicitudRegistro"("estado", "createdAt");

-- CreateIndex
CREATE INDEX "SolicitudRegistro_email_idx" ON "SolicitudRegistro"("email");

-- CreateIndex
CREATE INDEX "SolicitudRegistro_dni_idx" ON "SolicitudRegistro"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Persona_email_key" ON "Persona"("email");

-- AddForeignKey
ALTER TABLE "SolicitudRegistro" ADD CONSTRAINT "SolicitudRegistro_adminOid_fkey" FOREIGN KEY ("adminOid") REFERENCES "Administrativo"("oid") ON DELETE SET NULL ON UPDATE CASCADE;
