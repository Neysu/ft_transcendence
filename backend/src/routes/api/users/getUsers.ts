import type { FastifyInstance } from "fastify";
import { prisma } from "../../../lib/prisma";
import { getUsersSchema } from "../../../swagger/schemas";

export async function getUsers(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {

    // GET /api/user → récupérer tous les utilisateurs
    fastify.get("/", { schema: getUsersSchema }, async (request, reply) => {
      try {
        const users = await prisma.user.findMany({
          select: { id: true, username: true },
        });
        return { users } as { users: { id: number; username: string }[] };
      } catch (error) {
        fastify.log.error({ err: error }, "Failed to fetch users:");
        reply.code(500);
        return { status: "error", message: "Failed to fetch users" };
      }
    });
  });
}
