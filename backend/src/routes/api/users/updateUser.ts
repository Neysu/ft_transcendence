import type { FastifyInstance } from 'fastify';
import { prisma } from '../../../lib/prisma';

export async function updateUser(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {

    // PUT /api/user/:id → modifier un utilisateur
    fastify.put("/:id", async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { username, email } = request.body as { username?: string; email?: string };

        const updatedUser = await prisma.user.update({
          where: { id: Number(id) },
          data: { username, email },
          select: { id: true, username: true, email: true },
        });

        return updatedUser;
      } catch (error) {
        fastify.log.error({ err: error }, "Failed to update user:");
        reply.code(500);
        return { status: "error", message: "Failed to update user" };
      }
    });
  });
}