import type { FastifyInstance } from "fastify";
import { prisma } from "../../../lib/prisma";

export async function getUserById(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {

  // GET /api/user/:id → récupérer un utilisateur par son ID
  fastify.get("/:id", async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = await prisma.user.findUnique({
          where: { id: Number(id) },
          select: { id: true, username: true, email: true },
        });
        if (!user) {
          reply.code(404);
          return { status: "error", message: "User not found" };
        }
        return (user);
      } catch (error) {
        fastify.log.error({ err: error }, "Failed to fetch user:");
        reply.code(500);
        return { status: "error", message: "Failed to fetch user" };
      }
    });
  });
}