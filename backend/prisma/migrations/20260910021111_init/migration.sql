-- CreateTable
CREATE TABLE "Cuenta" (
    "oid" SERIAL NOT NULL,
    "dni" TEXT NOT NULL,
    "nombreUsuario" TEXT NOT NULL,
    "contrasenia" TEXT NOT NULL,
    "personaOid" INTEGER NOT NULL,

    CONSTRAINT "Cuenta_pkey" PRIMARY KEY ("oid")
);

-- CreateTable
CREATE TABLE "Persona" (
    "oid" SERIAL NOT NULL,
    "dni" TEXT NOT NULL,
    "nombreApellido" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("oid")
);

-- CreateTable
CREATE TABLE "Telefono" (
    "oid" SERIAL NOT NULL,
    "nroTelefono" TEXT NOT NULL,
    "personaOid" INTEGER NOT NULL,

    CONSTRAINT "Telefono_pkey" PRIMARY KEY ("oid")
);

-- CreateTable
CREATE TABLE "Pasajero" (
    "oid" SERIAL NOT NULL,
    "certificadoDiscapacidad" TEXT NOT NULL,
    "personaOid" INTEGER NOT NULL,
    "adminOid" INTEGER,

    CONSTRAINT "Pasajero_pkey" PRIMARY KEY ("oid")
);

-- CreateTable
CREATE TABLE "Chofer" (
    "oid" SERIAL NOT NULL,
    "nroLicenciaConducir" TEXT NOT NULL,
    "personaOid" INTEGER NOT NULL,

    CONSTRAINT "Chofer_pkey" PRIMARY KEY ("oid")
);

-- CreateTable
CREATE TABLE "Administrativo" (
    "oid" SERIAL NOT NULL,
    "legajo" TEXT NOT NULL,
    "personaOid" INTEGER NOT NULL,

    CONSTRAINT "Administrativo_pkey" PRIMARY KEY ("oid")
);

-- CreateTable
CREATE TABLE "Linea" (
    "oid" SERIAL NOT NULL,
    "nroLinea" TEXT NOT NULL,
    "ramal" TEXT NOT NULL,

    CONSTRAINT "Linea_pkey" PRIMARY KEY ("oid")
);

-- CreateTable
CREATE TABLE "Conduce" (
    "oid" SERIAL NOT NULL,
    "fechaHoraInicio" TIMESTAMP(3) NOT NULL,
    "fechaHoraFin" TIMESTAMP(3),
    "choferOid" INTEGER NOT NULL,
    "lineaOid" INTEGER NOT NULL,

    CONSTRAINT "Conduce_pkey" PRIMARY KEY ("oid")
);

-- CreateTable
CREATE TABLE "ParadaAscenso" (
    "oid" SERIAL NOT NULL,
    "nroParada" TEXT NOT NULL,
    "latitud" DOUBLE PRECISION NOT NULL,
    "longitud" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ParadaAscenso_pkey" PRIMARY KEY ("oid")
);

-- CreateTable
CREATE TABLE "Viaje" (
    "oid" SERIAL NOT NULL,
    "numeroSolicitud" TEXT NOT NULL,
    "fechaHoraInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaHoraFin" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "paradaOid" INTEGER NOT NULL,
    "pasajeroOid" INTEGER NOT NULL,
    "conduceOid" INTEGER NOT NULL,

    CONSTRAINT "Viaje_pkey" PRIMARY KEY ("oid")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cuenta_nombreUsuario_key" ON "Cuenta"("nombreUsuario");

-- CreateIndex
CREATE UNIQUE INDEX "Cuenta_personaOid_key" ON "Cuenta"("personaOid");

-- CreateIndex
CREATE UNIQUE INDEX "Telefono_nroTelefono_personaOid_key" ON "Telefono"("nroTelefono", "personaOid");

-- CreateIndex
CREATE UNIQUE INDEX "Pasajero_personaOid_key" ON "Pasajero"("personaOid");

-- CreateIndex
CREATE UNIQUE INDEX "Chofer_personaOid_key" ON "Chofer"("personaOid");

-- CreateIndex
CREATE UNIQUE INDEX "Administrativo_legajo_key" ON "Administrativo"("legajo");

-- CreateIndex
CREATE UNIQUE INDEX "Administrativo_personaOid_key" ON "Administrativo"("personaOid");

-- CreateIndex
CREATE UNIQUE INDEX "Linea_nroLinea_ramal_key" ON "Linea"("nroLinea", "ramal");

-- CreateIndex
CREATE UNIQUE INDEX "ParadaAscenso_nroParada_key" ON "ParadaAscenso"("nroParada");

-- CreateIndex
CREATE UNIQUE INDEX "Viaje_numeroSolicitud_key" ON "Viaje"("numeroSolicitud");

-- AddForeignKey
ALTER TABLE "Cuenta" ADD CONSTRAINT "Cuenta_personaOid_fkey" FOREIGN KEY ("personaOid") REFERENCES "Persona"("oid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Telefono" ADD CONSTRAINT "Telefono_personaOid_fkey" FOREIGN KEY ("personaOid") REFERENCES "Persona"("oid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pasajero" ADD CONSTRAINT "Pasajero_personaOid_fkey" FOREIGN KEY ("personaOid") REFERENCES "Persona"("oid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pasajero" ADD CONSTRAINT "Pasajero_adminOid_fkey" FOREIGN KEY ("adminOid") REFERENCES "Administrativo"("oid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chofer" ADD CONSTRAINT "Chofer_personaOid_fkey" FOREIGN KEY ("personaOid") REFERENCES "Persona"("oid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Administrativo" ADD CONSTRAINT "Administrativo_personaOid_fkey" FOREIGN KEY ("personaOid") REFERENCES "Persona"("oid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conduce" ADD CONSTRAINT "Conduce_choferOid_fkey" FOREIGN KEY ("choferOid") REFERENCES "Chofer"("oid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conduce" ADD CONSTRAINT "Conduce_lineaOid_fkey" FOREIGN KEY ("lineaOid") REFERENCES "Linea"("oid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viaje" ADD CONSTRAINT "Viaje_paradaOid_fkey" FOREIGN KEY ("paradaOid") REFERENCES "ParadaAscenso"("oid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viaje" ADD CONSTRAINT "Viaje_pasajeroOid_fkey" FOREIGN KEY ("pasajeroOid") REFERENCES "Pasajero"("oid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viaje" ADD CONSTRAINT "Viaje_conduceOid_fkey" FOREIGN KEY ("conduceOid") REFERENCES "Conduce"("oid") ON DELETE RESTRICT ON UPDATE CASCADE;
