import { prisma } from "../prisma";

export type UserGameStats = {
  gamesPlayed: number;
  gamesWon: number;
};

export async function getUserGameStats(userId: number): Promise<UserGameStats> {
  const gamesPlayed = await prisma.game.count({
    where: {
      OR: [{ playerOneId: userId }, { playerTwoId: userId }],
    },
  });

  const finishedGames = await prisma.game.findMany({
    where: {
      status: "FINISHED",
      OR: [{ playerOneId: userId }, { playerTwoId: userId }],
    },
    select: {
      playerOneId: true,
      playerTwoId: true,
      playerOneScore: true,
      playerTwoScore: true,
    },
  });

  let gamesWon = 0;
  for (const game of finishedGames) {
    const didWinAsPlayerOne =
      game.playerOneId === userId && game.playerOneScore > game.playerTwoScore;
    const didWinAsPlayerTwo =
      game.playerTwoId === userId && game.playerTwoScore > game.playerOneScore;
    if (didWinAsPlayerOne || didWinAsPlayerTwo) {
      gamesWon += 1;
    }
  }

  return { gamesPlayed, gamesWon };
}
