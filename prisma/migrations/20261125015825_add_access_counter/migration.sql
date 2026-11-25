-- CreateTable
CREATE TABLE "AccessCounter" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AccessCounter_pkey" PRIMARY KEY ("id")
);
