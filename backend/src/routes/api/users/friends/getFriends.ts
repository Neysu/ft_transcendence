import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../lib/prisma";
import { authMiddleware } from "../../../../middleware/auth";
import { getFriendsSchema } from "../../../../swagger/schemas";

export async function getFriends(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    // GET /api/user/friends → récupérer les amis de l'utilisateur connecté
    fastify.get("/", { schema: getFriendsSchema, preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
      async (request, reply) => {
        try {
          const authUser = (request as { user?: { id?: number } }).user;
          if (!authUser?.id) {
            reply.code(401);
            return { status: "error", message: "Missing token" };
          }

          const accepted = await prisma.friendship.findMany({
            where: {
              status: "ACCEPTED",
              OR: [{ requesterId: authUser.id }, { addresseeId: authUser.id }],
            },
            select: {
              requesterId: true,
              addresseeId: true,
              requester: { select: { id: true, username: true, profileImage: true } },
              addressee: { select: { id: true, username: true, profileImage: true } },
            },
          });

          const friends = accepted.map((row) => {
            if (row.requesterId === authUser.id) {
              return row.addressee;
            }
            return row.requester;
          });

          return { friends };
        } catch (error) {
          fastify.log.error({ err: error }, "Failed to fetch friends:");
          reply.code(500);
          return { status: "error", message: "Failed to fetch friends" };
        }
      }
    );
  });
}
