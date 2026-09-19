/*
  Warnings:

  - The `estado` column on the `Viaje` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `destino` to the `Viaje` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoViaje" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'ABORDO', 'FINALIZADO', 'CANCELADO');

-- AlterTable
ALTER TABLE "Viaje" ADD COLUMN     "destino" TEXT NOT NULL,
DROP COLUMN "estado",
ADD COLUMN     "estado" "EstadoViaje" NOT NULL DEFAULT 'PENDIENTE';
