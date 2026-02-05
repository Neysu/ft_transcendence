import type { FastifyInstance } from "fastify";
import { chatWs } from "./chat";
import { gameWs } from "./games";

export default async function wsRoutes(fastify: FastifyInstance)
{
  fastify.register(chatWs);
  fastify.register(gameWs);
}
