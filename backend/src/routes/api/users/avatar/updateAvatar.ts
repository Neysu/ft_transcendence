import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../lib/prisma";
import { findUserByIdOrUsername } from "../../../../lib/api/userUtils";
import { AvatarUpdateSchema, UserIdParamSchema } from "../../../../lib/api/schemasZod";
import { parseOrReply } from "../../../../lib/api/validation";
import { updateAvatarSchema } from "../../../../swagger/schemas";
import { authMiddleware } from "../../../../middleware/auth";

export async function updateAvatar(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    // PUT /api/user/avatar/:id → mettre a jour l'avatar d'un utilisateur
    fastify.put("/avatar/:id",
      { schema: updateAvatarSchema, preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
      async (request, reply) => {
      try {
        const params = parseOrReply(UserIdParamSchema, request.params, reply);
        if (!params) {
          return;
        }
        const body = parseOrReply(AvatarUpdateSchema, request.body, reply);
        if (!body) {
          return;
        }

        const user = await findUserByIdOrUsername(params.id, { id: true });
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
          data: { profileImage: body.profileImage },
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
