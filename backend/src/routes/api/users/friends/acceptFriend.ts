import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../lib/prisma";
import { FriendAcceptSchema } from "../../../../lib/api/schemasZod";
import { parseOrReply } from "../../../../lib/api/validation";
import { friendAcceptSchema } from "../../../../swagger/schemas";
import { authMiddleware } from "../../../../middleware/auth";

export async function acceptFriend(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    // POST /api/user/friends/accept → accepter une demande d'ami
    fastify.post("/accept", { schema: friendAcceptSchema, preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
      async (request, reply) => {
        try {
          const body = parseOrReply(FriendAcceptSchema, request.body, reply);
          if (!body) {
            return;
          }

          const authUser = (request as { user?: { id?: number } }).user;
          if (!authUser?.id) {
            reply.code(401);
            return { status: "error", message: "Missing token" };
          }

          if (authUser.id === body.fromUserId) {
            reply.code(400);
            return { status: "error", message: "Invalid request" };
          }

          const requestRow = await prisma.friendship.findFirst({
            where: {
              requesterId: body.fromUserId,
              addresseeId: authUser.id,
            },
            select: { id: true, status: true },
          });

          if (!requestRow) {
            reply.code(404);
            return { status: "error", message: "Friend request not found" };
          }

          if (requestRow.status === "ACCEPTED") {
            return { status: "success", message: "Already friends" };
          }
          if (requestRow.status === "BLOCKED") {
            reply.code(409);
            return { status: "error", message: "Friend request blocked" };
          }

          await prisma.friendship.update({
            where: { id: requestRow.id },
            data: { status: "ACCEPTED" },
          });

          return { status: "success" };
        } catch (error) {
          fastify.log.error({ err: error }, "Failed to accept friend request:");
          reply.code(500);
          return { status: "error", message: "Failed to accept friend request" };
        }
      }
    );
  });
}
