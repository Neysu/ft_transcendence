import type { FastifyInstance } from 'fastify';
import { prisma } from '../../../lib/prisma';
import { findUserByIdOrUsername } from "../../../lib/api/userUtils";
import { updateUserSchema } from "../../../swagger/schemas";
import { authMiddleware } from "../../../middleware/auth";

export async function updateUser(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {

    // PUT /api/user/:id → modifier un utilisateur
    fastify.put("/:id",
      { schema: updateUserSchema, preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
      async (request, reply) => {
        try {
        const { id } = request.params as { id: string };
        const user = await findUserByIdOrUsername(id, { id: true });
        if (!user) {
          reply.code(404);
          return { status: "error", message: "User not found" };
        }

        const authUser = (request as { user?: { id?: number } }).user;
        if (!authUser?.id || authUser.id !== user.id) {
          reply.code(403);
          return { status: "error", message: "Forbidden" };
        }

        const { username, email } = request.body as { username?: string; email?: string };
        if (username && /^[0-9]+$/.test(username)) {
          reply.code(400);
          return { status: "error", message: "Username cannot be only digits" };
        }

        const updatedUser = await prisma.user.update({
          where: { id: user.id },
            data: { username, email },
            select: { id: true, username: true, email: true },
          });

          return updatedUser;
        } catch (error) {
          fastify.log.error({ err: error }, "Failed to update user:");
          reply.code(500);
          return { status: "error", message: "Failed to update user" };
        }
      }
    );
  });
}
