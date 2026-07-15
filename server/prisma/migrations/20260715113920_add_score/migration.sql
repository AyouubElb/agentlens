-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "justification" TEXT,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Score_runId_idx" ON "Score"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "Score_runId_criterionId_key" ON "Score"("runId", "criterionId");

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
