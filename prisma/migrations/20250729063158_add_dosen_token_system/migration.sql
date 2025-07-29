-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "namaMataKuliah" TEXT NOT NULL,
    "kelas" TEXT NOT NULL,
    "tahunAwalPeriode" INTEGER NOT NULL,
    "tahunAkhirPeriode" INTEGER NOT NULL,
    "periode" TEXT NOT NULL,
    "dosenId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dosen_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dosen_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dosen_token_usage" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dosen_token_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "courses_dosenId_idx" ON "courses"("dosenId");

-- CreateIndex
CREATE INDEX "courses_tahunAwalPeriode_tahunAkhirPeriode_idx" ON "courses"("tahunAwalPeriode", "tahunAkhirPeriode");

-- CreateIndex
CREATE INDEX "courses_periode_idx" ON "courses"("periode");

-- CreateIndex
CREATE UNIQUE INDEX "dosen_tokens_token_key" ON "dosen_tokens"("token");

-- CreateIndex
CREATE INDEX "dosen_tokens_token_idx" ON "dosen_tokens"("token");

-- CreateIndex
CREATE INDEX "dosen_token_usage_tokenId_idx" ON "dosen_token_usage"("tokenId");

-- CreateIndex
CREATE INDEX "dosen_token_usage_userId_idx" ON "dosen_token_usage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dosen_token_usage_tokenId_userId_key" ON "dosen_token_usage"("tokenId", "userId");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dosen_token_usage" ADD CONSTRAINT "dosen_token_usage_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "dosen_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dosen_token_usage" ADD CONSTRAINT "dosen_token_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
