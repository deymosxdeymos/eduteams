-- CreateTable
CREATE TABLE "public"."assignment_topics" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."assignment_topic_preferences" (
    "id" TEXT NOT NULL,
    "assignmentTopicId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "preference" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_topic_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assignment_topics_assignmentId_idx" ON "public"."assignment_topics"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_topics_assignmentId_name_key" ON "public"."assignment_topics"("assignmentId", "name");

-- CreateIndex
CREATE INDEX "assignment_topic_preferences_assignmentTopicId_idx" ON "public"."assignment_topic_preferences"("assignmentTopicId");

-- CreateIndex
CREATE INDEX "assignment_topic_preferences_personId_idx" ON "public"."assignment_topic_preferences"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_topic_preferences_assignmentTopicId_personId_key" ON "public"."assignment_topic_preferences"("assignmentTopicId", "personId");

-- AddForeignKey
ALTER TABLE "public"."assignment_topics" ADD CONSTRAINT "assignment_topics_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assignment_topic_preferences" ADD CONSTRAINT "assignment_topic_preferences_assignmentTopicId_fkey" FOREIGN KEY ("assignmentTopicId") REFERENCES "public"."assignment_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assignment_topic_preferences" ADD CONSTRAINT "assignment_topic_preferences_personId_fkey" FOREIGN KEY ("personId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
