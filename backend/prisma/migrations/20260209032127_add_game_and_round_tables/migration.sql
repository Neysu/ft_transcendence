-- CreateTable
CREATE TABLE "Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "playerOneId" INTEGER NOT NULL,
    "playerTwoId" INTEGER NOT NULL,
    "playerOneScore" INTEGER NOT NULL DEFAULT 0,
    "playerTwoScore" INTEGER NOT NULL DEFAULT 0,
    "round" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ONGOING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Round" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameId" INTEGER NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "playerOneMove" TEXT,
    "playerTwoMove" TEXT,
    "winnerId" INTEGER,
    CONSTRAINT "Round_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
