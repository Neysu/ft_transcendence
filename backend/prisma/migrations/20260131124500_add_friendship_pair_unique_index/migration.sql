-- CreateIndex
CREATE UNIQUE INDEX "Friendship_pair_unique" ON "Friendship" (
  CASE WHEN "requesterId" < "addresseeId" THEN "requesterId" ELSE "addresseeId" END,
  CASE WHEN "requesterId" < "addresseeId" THEN "addresseeId" ELSE "requesterId" END
);
