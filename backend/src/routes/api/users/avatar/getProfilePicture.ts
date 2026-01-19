import type { FastifyInstance } from "fastify";
import { findUserByIdOrUsername } from "../../../../lib/api/userUtils";
import { UserIdParamSchema } from "../../../../lib/api/schemasZod";
import { parseOrReply } from "../../../../lib/api/validation";
import { getProfilePictureSchema } from "../../../../swagger/schemas";

export async function getProfilePicture(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {

    // GET /api/user/avatar/:id → récupérer l'avatar d'un utilisateur avec son id ou son username
    fastify.get("/avatar/:id", { schema: getProfilePictureSchema }, async (request, reply) => {
      try {	
        const params = parseOrReply(UserIdParamSchema, request.params, reply);
        if (!params) {
          return;
        }
        const user = await findUserByIdOrUsername(params.id, {
          profileImage: true,
        });

        if (!user) {
          reply.code(404);
          return { status: "error", message: "User not found" };
        }

        if (!user.profileImage) {
          reply.code(404);
          return { status: "error", message: "Profile image not found" };
        }

        return { profileImage: user.profileImage };
      } catch (error) {
        fastify.log.error({ err: error }, "Failed to fetch profile picture:");
        reply.code(500);
        return { status: "error", message: "Failed to fetch profile picture" };
      }
    });
  });
}
