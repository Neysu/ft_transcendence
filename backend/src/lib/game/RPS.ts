export type Move = 'ROCK' | 'PAPER' | 'SCISSORS';
export type Outcome = 'PLAYER1' | 'PLAYER2' | 'DRAW';

const beats: Record<Move, Move> = {
  ROCK: 'SCISSORS',
  PAPER: 'ROCK',
  SCISSORS: 'PAPER',
};

export class RPSGame {
  // Returns which player wins the round given two moves.
  static getWinner(move1: Move, move2: Move): Outcome {
    if (move1 === move2) return 'DRAW';
    return beats[move1] === move2 ? 'PLAYER1' : 'PLAYER2';
  }

  // Simple AI: randomly picks one of the three moves.
  static getAIMove(): Move {
    const moves: Move[] = ['ROCK', 'PAPER', 'SCISSORS'];
    const index = Math.floor(Math.random() * moves.length);
    return moves[index];
  }

  // Weighted AI: picks thresholds each round, then rolls 1-10.
  static getWeightedAIMove(): Move {
    const first = Math.floor(Math.random() * 9) + 1;
    const second = Math.floor(Math.random() * (10 - first)) + first + 1;
    const roll = Math.floor(Math.random() * 10) + 1;

    if (roll <= first) return "ROCK";
    if (roll <= second) return "PAPER";
    return "SCISSORS";
  }
}
