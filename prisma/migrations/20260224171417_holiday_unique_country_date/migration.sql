/*
  Warnings:

  - A unique constraint covering the columns `[date,country]` on the table `Holiday` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Holiday_date_country_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_date_country_key" ON "Holiday"("date", "country");
