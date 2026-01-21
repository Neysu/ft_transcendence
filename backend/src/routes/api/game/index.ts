import type { FastifyInstance } from "fastify";
import { rpsRoute } from "./rps";

export async function Game(fastify: FastifyInstance) {
  fastify.register(rpsRoute);
}
