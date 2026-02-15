-- CreateEnum
CREATE TYPE "WfhRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "WfhRequest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "WfhRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedById" INTEGER,
    "weatherCode" INTEGER,
    "precipSum" DOUBLE PRECISION,
    "windMax" DOUBLE PRECISION,

    CONSTRAINT "WfhRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WfhRequest_date_idx" ON "WfhRequest"("date");

-- CreateIndex
CREATE INDEX "WfhRequest_status_idx" ON "WfhRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WfhRequest_userId_date_key" ON "WfhRequest"("userId", "date");

-- AddForeignKey
ALTER TABLE "WfhRequest" ADD CONSTRAINT "WfhRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WfhRequest" ADD CONSTRAINT "WfhRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
