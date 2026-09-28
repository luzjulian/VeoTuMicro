/*
  Warnings:

  - You are about to drop the column `numeroSolicitud` on the `Viaje` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[dni]` on the table `Persona` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `Viaje` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idempotencyKey` to the `Viaje` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Viaje_numeroSolicitud_key";

-- AlterTable
ALTER TABLE "Viaje" DROP COLUMN "numeroSolicitud",
ADD COLUMN     "idempotencyKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Persona_dni_key" ON "Persona"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Viaje_idempotencyKey_key" ON "Viaje"("idempotencyKey");
