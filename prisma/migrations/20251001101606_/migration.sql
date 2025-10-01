-- CreateTable
CREATE TABLE "public"."personality_questions" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "reversed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personality_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "personality_questions_dimension_idx" ON "public"."personality_questions"("dimension");

-- CreateIndex
CREATE UNIQUE INDEX "personality_questions_order_key" ON "public"."personality_questions"("order");
