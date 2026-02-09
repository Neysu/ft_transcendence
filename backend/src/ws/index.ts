import type { FastifyInstance } from "fastify";
import { chatWs } from "./chat";
import { gameWs } from "./games";
import { presenceWs } from "./presence";

export default async function wsRoutes(fastify: FastifyInstance)
{
  fastify.register(chatWs);
  fastify.register(gameWs);
  fastify.register(presenceWs);
}
