import type { FastifyInstance } from "fastify";
import { rpsRoute } from "./rps";
import { botGameRoute } from "./bot";

export async function Game(fastify: FastifyInstance) {
  fastify.register(rpsRoute);
  fastify.register(botGameRoute);
}
