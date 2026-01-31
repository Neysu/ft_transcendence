import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../lib/prisma";
import { FriendRejectSchema } from "../../../../lib/api/schemasZod";
import { parseOrReply } from "../../../../lib/api/validation";
import { friendRejectSchema } from "../../../../swagger/schemas";
import { authMiddleware } from "../../../../middleware/auth";

export async function rejectFriend(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    // POST /api/user/friends/reject → refuser une demande d'ami
    fastify.post("/reject", { schema: friendRejectSchema, preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
      async (request, reply) => {
        try {
          const body = parseOrReply(FriendRejectSchema, request.body, reply);
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
              requesterId: body.fromUserId,
              addresseeId: authUser.id,
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
          fastify.log.error({ err: error }, "Failed to reject friend request:");
          reply.code(500);
          return { status: "error", message: "Failed to reject friend request" };
        }
      }
    );
  });
}
