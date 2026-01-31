import type { FastifyInstance } from "fastify";
import { chatWs } from "./chat";

export default async function wsRoutes(fastify: FastifyInstance)
{
  fastify.register(chatWs);
}
