-- CreateTable
CREATE TABLE "session_handoffs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rememberMe" BOOLEAN NOT NULL,
    "targetHost" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "session_handoffs_userId_idx" ON "session_handoffs"("userId");

-- AddForeignKey
ALTER TABLE "session_handoffs" ADD CONSTRAINT "session_handoffs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
