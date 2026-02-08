import type { FastifyInstance } from "fastify";
import { replaceUserAvatar, validateAvatarUpload } from "../../../../lib/api/avatarUtils";
import { findUserByIdOrUsername } from "../../../../lib/api/userUtils";
import { UserIdParamSchema } from "../../../../lib/api/schemasZod";
import { parseOrReply } from "../../../../lib/api/validation";
import { updateAvatarSchema } from "../../../../swagger/schemas";
import { authMiddleware } from "../../../../middleware/auth";

export async function updateAvatar(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    // PUT /api/user/avatar/:id → mettre a jour l'avatar d'un utilisateur
    fastify.put("/avatar/:id",
      {
        schema: updateAvatarSchema,
        validatorCompiler: () => () => true,
        preHandler: (req, rep) => authMiddleware(fastify, req, rep),
      },
      async (request, reply) => {
      try {
        const params = parseOrReply(UserIdParamSchema, request.params, reply);
        if (!params) {
          return;
        }

        const user = await findUserByIdOrUsername(params.id, { id: true, profileImage: true });
        if (!user) {
          reply.code(404);
          return { status: "error", message: "User not found" };
        }
        const authUser = (request as { user?: { id?: number } }).user;
        if (!authUser?.id) {
          reply.code(401);
          return { status: "error", message: "Unauthorized: missing or invalid token" };
        }
        if (authUser.id !== user.id) {
          reply.code(403);
          return { status: "error", message: "Forbidden: you can only change your own avatar" };
        }

        const validation = await validateAvatarUpload(request);
        if (!validation.ok) {
          reply.code(validation.status);
          return { status: "error", message: validation.message };
        }
        const updatedUser = await replaceUserAvatar(
          user.id,
          user.profileImage,
          validation.buffer,
          validation.format,
        );

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
