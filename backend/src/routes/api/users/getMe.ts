import type { FastifyInstance } from "fastify";
import { prisma } from "../../../lib/prisma";
import { authMiddleware } from "../../../middleware/auth";
import { getMeSchema } from "../../../swagger/schemas";

export async function getMe(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    // GET /api/user/me → récupérer l'utilisateur connecté
    fastify.get("/me",
      { schema: getMeSchema, preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
      async (request, reply) => {
        try {
          const authUser = (request as { user?: { id?: number } }).user;
          if (!authUser?.id) {
            reply.code(401);
            return { status: "error", message: "Missing token" };
          }

          const user = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: { id: true, username: true, email: true, profileImage: true },
          });

          if (!user) {
            reply.code(404);
            return { status: "error", message: "User not found" };
          }

          return user;
        } catch (error) {
          fastify.log.error({ err: error }, "Failed to fetch current user:");
          reply.code(500);
          return { status: "error", message: "Failed to fetch current user" };
        }
      }
    );
  });
}
