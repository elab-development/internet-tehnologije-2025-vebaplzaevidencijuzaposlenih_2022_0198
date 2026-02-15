-- CreateTable
CREATE TABLE "WeatherDaily" (
    "id" SERIAL NOT NULL,
    "locationKey" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "tempMax" DOUBLE PRECISION,
    "tempMin" DOUBLE PRECISION,
    "precipSum" DOUBLE PRECISION,
    "windMax" DOUBLE PRECISION,
    "weatherCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeatherDaily_date_idx" ON "WeatherDaily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherDaily_locationKey_date_key" ON "WeatherDaily"("locationKey", "date");
