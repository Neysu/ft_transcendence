import type { FastifyInstance } from "fastify";
import { prisma } from "../../../lib/prisma";

export async function getUsers(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {

    // GET /api/user/users → récupérer tous les utilisateurs
    fastify.get("/", async (request, reply) => {
      try {
        const users = await prisma.user.findMany({
          select: { id: true, username: true, email: true },
        });
        return { users };
      } catch (error) {
        fastify.log.error({ err: error }, "Failed to fetch users:");
        reply.code(500);
        return { status: "error", message: "Failed to fetch users" };
      }
    });
  });
}