import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { healthSchema } from "../../swagger/schemas";

export async function Health(fastify: FastifyInstance) {
  fastify.get("/health", { schema: healthSchema }, async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ok", db: "connected" };
    } catch (error) {
      fastify.log.error({ err: error }, "DB health check failed:");
      reply.code(500);
      return { status: "error", db: "disconnected" };
    }
  });
}
  
