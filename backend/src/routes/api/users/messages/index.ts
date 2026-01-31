import type { FastifyInstance } from "fastify";
import { getMessages } from "./getMessages";

export async function Messages(fastify: FastifyInstance) {
  fastify.register(getMessages);
}
