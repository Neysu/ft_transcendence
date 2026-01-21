import type { FastifyInstance } from "fastify";
import { RPSGame, type Move } from "../../../lib/game/RPS";
import { parseOrReply } from "../../../lib/api/validation";
import { RpsPlaySchema } from "../../../lib/api/schemasZod";
import { rpsPlaySchema } from "../../../swagger/schemas";

export async function rpsRoute(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    fastify.post("/rps", { schema: rpsPlaySchema }, async (request, reply) => {
      const body = parseOrReply(RpsPlaySchema, request.body, reply);
      if (!body) return;

      const player2: Move = body.useAI ? RPSGame.getAIMove() : (body.player2 as Move);
      const outcome = RPSGame.getWinner(body.player1, player2);

      return { player1: body.player1, player2, outcome };
    });
  });
}
