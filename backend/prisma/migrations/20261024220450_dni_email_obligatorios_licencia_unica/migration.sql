/*
  Warnings:

  - You are about to drop the column `dni` on the `Cuenta` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nroLicenciaConducir]` on the table `Chofer` will be added. If there are existing duplicate values, this will fail.
  - Made the column `dni` on table `Persona` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `Persona` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dni` on table `SolicitudRegistro` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Cuenta" DROP COLUMN "dni";

-- AlterTable
ALTER TABLE "Persona" ALTER COLUMN "dni" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL;

-- AlterTable
ALTER TABLE "SolicitudRegistro" ALTER COLUMN "dni" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Chofer_nroLicenciaConducir_key" ON "Chofer"("nroLicenciaConducir");
