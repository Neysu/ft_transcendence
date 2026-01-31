import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../lib/prisma";
import { FriendRequestSchema } from "../../../../lib/api/schemasZod";
import { parseOrReply } from "../../../../lib/api/validation";
import { friendCancelSchema } from "../../../../swagger/schemas";
import { authMiddleware } from "../../../../middleware/auth";

export async function cancelFriendRequest(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    // POST /api/user/friends/requests/cancel → annuler une demande envoyée
    fastify.post(
      "/requests/cancel",
      { schema: friendCancelSchema, preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
      async (request, reply) => {
        try {
          const body = parseOrReply(FriendRequestSchema, request.body, reply);
          if (!body) {
            return;
          }

          const authUser = (request as { user?: { id?: number } }).user;
          if (!authUser?.id) {
            reply.code(401);
            return { status: "error", message: "Missing token" };
          }

          const requestRow = await prisma.friendship.findFirst({
            where: {
              requesterId: authUser.id,
              addresseeId: body.toUserId,
              status: "PENDING",
            },
            select: { id: true },
          });

          if (!requestRow) {
            reply.code(404);
            return { status: "error", message: "Friend request not found" };
          }

          await prisma.friendship.delete({ where: { id: requestRow.id } });
          return { status: "success" };
        } catch (error) {
          fastify.log.error({ err: error }, "Failed to cancel friend request:");
          reply.code(500);
          return { status: "error", message: "Failed to cancel friend request" };
        }
      }
    );
  });
}
