import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../lib/prisma";
import { authMiddleware } from "../../../../middleware/auth";
import { getFriendRequestsSentSchema } from "../../../../swagger/schemas";
import { normalizeProfileImageUrl } from "../../../../lib/api/avatarUtils";

export async function getFriendRequestsSent(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    // GET /api/user/friends/requests/sent → demandes envoyées
    fastify.get("/requests/sent", { schema: getFriendRequestsSentSchema, preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
      async (request, reply) => {
        try {
          const authUser = (request as { user?: { id?: number } }).user;
          if (!authUser?.id) {
            reply.code(401);
            return { status: "error", message: "Missing token" };
          }

          const requests = await prisma.friendship.findMany({
            where: {
              status: "PENDING",
              requesterId: authUser.id,
            },
            select: {
              id: true,
              status: true,
              createdAt: true,
              addressee: { select: { id: true, username: true, profileImage: true } },
            },
            orderBy: { createdAt: "desc" },
          });

          const mapped = requests.map((request: {
            id: number;
            status: string;
            createdAt: Date;
            addressee: { id: number; username: string; profileImage: string | null };
          }) => ({
            id: request.id,
            status: request.status,
            createdAt: request.createdAt,
            user: {
              ...request.addressee,
              profileImage: normalizeProfileImageUrl(request.addressee.profileImage, {
                logger: fastify.log,
                userId: request.addressee.id,
                context: "getFriendRequestsSent",
              }),
            },
          }));

          return { requests: mapped };
        } catch (error) {
          fastify.log.error({ err: error }, "Failed to fetch sent friend requests:");
          reply.code(500);
          return { status: "error", message: "Failed to fetch sent friend requests" };
        }
      }
    );
  });
}
