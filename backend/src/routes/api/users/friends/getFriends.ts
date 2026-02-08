import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../lib/prisma";
import { authMiddleware } from "../../../../middleware/auth";
import { getFriendsSchema } from "../../../../swagger/schemas";
import { normalizeProfileImageUrl } from "../../../../lib/api/avatarUtils";

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

          const friends = accepted.map((row: {
            requesterId: number;
            requester: { id: number; username: string; profileImage: string | null };
            addressee: { id: number; username: string; profileImage: string | null };
          }) => {
            const user = row.requesterId === authUser.id ? row.addressee : row.requester;
            return {
              ...user,
              profileImage: normalizeProfileImageUrl(user.profileImage, {
                logger: fastify.log,
                userId: user.id,
                context: "getFriends",
              }),
            };
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
