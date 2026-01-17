import type { FastifyInstance } from "fastify";
import { findUserByIdOrUsername } from "../../../../lib/api/userUtils";
import { getProfilePictureSchema } from "../../../../swagger/schemas";

export async function getProfilePicture(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {

    // GET /api/user/avatar/:id → récupérer l'avatar d'un utilisateur avec son id ou son username
    fastify.get("/avatar/:id", { schema: getProfilePictureSchema }, async (request, reply) => {
      try {	
        const { id } = request.params as { id: string };
        const user = await findUserByIdOrUsername(id, {
          id: true,
          username: true,
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

        return { id: user.id, username: user.username, profileImage: user.profileImage };
      } catch (error) {
        fastify.log.error({ err: error }, "Failed to fetch profile picture:");
        reply.code(500);
        return { status: "error", message: "Failed to fetch profile picture" };
      }
    });
  });
}
