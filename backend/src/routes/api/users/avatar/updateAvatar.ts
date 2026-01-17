import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../lib/prisma";
import { findUserByIdOrUsername } from "../../../../lib/api/userUtils";
import { updateAvatarSchema } from "../../../../swagger/schemas";
import { authMiddleware } from "../../../../middleware/auth";

export async function updateAvatar(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    // PUT /api/user/avatar/:id → mettre a jour l'avatar d'un utilisateur
    fastify.put("/avatar/:id",
      { schema: updateAvatarSchema, preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
      async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { profileImage } = request.body as { profileImage?: string };

        if (!profileImage) {
          reply.code(400);
          return { status: "error", message: "Missing profileImage" };
        }

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

        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { profileImage },
          select: { id: true, username: true, profileImage: true },
        });

        return updatedUser;
      } catch (error) {
        fastify.log.error({ err: error }, "Failed to update avatar:");
        reply.code(500);
        return { status: "error", message: "Failed to update avatar" };
      }
      }
    );
  });
}
