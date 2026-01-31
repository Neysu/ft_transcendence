import type { FastifyInstance } from "fastify";
import { getProfileImageOrFallback } from "../../../../lib/api/avatarUtils";
import { prisma } from "../../../../lib/prisma";
import { authMiddleware } from "../../../../middleware/auth";
import { getProfilePictureMeSchema } from "../../../../swagger/schemas";

export async function getMyProfilePicture(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    // GET /api/user/avatar/me → récupérer l'avatar de l'utilisateur connecté
    fastify.get("/avatar/me",
      { schema: getProfilePictureMeSchema, preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
      async (request, reply) => {
        try {
          const authUser = (request as { user?: { id?: number } }).user;
          if (!authUser?.id) {
            reply.code(401);
            return { status: "error", message: "Missing token" };
          }

          const user = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: { profileImage: true },
          });

          if (!user) {
            reply.code(404);
            return { status: "error", message: "User not found" };
          }

          if (!user.profileImage) {
            reply.code(404);
            return { status: "error", message: "Profile image not found" };
          }

          const resolvedProfileImage = await getProfileImageOrFallback(
            authUser.id,
            user.profileImage,
          );
          return { profileImage: resolvedProfileImage };
        } catch (error) {
          fastify.log.error({ err: error }, "Failed to fetch profile picture:");
          reply.code(500);
          return { status: "error", message: "Failed to fetch profile picture" };
        }
      }
    );
  });
}
