import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../lib/prisma";
import { FriendRequestSchema } from "../../../../lib/api/schemasZod";
import { parseOrReply } from "../../../../lib/api/validation";
import { friendRemoveSchema } from "../../../../swagger/schemas";
import { authMiddleware } from "../../../../middleware/auth";

export async function removeFriend(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    // POST /api/user/friends/remove → retirer un ami (relation ACCEPTED)
    fastify.post(
      "/remove",
      { schema: friendRemoveSchema, preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
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

          if (authUser.id === body.toUserId) {
            reply.code(400);
            return { status: "error", message: "Cannot remove yourself" };
          }

          const friendship = await prisma.friendship.findFirst({
            where: {
              status: "ACCEPTED",
              OR: [
                { requesterId: authUser.id, addresseeId: body.toUserId },
                { requesterId: body.toUserId, addresseeId: authUser.id },
              ],
            },
            select: { id: true },
          });

          if (!friendship) {
            reply.code(404);
            return { status: "error", message: "Friend not found" };
          }

          await prisma.friendship.delete({ where: { id: friendship.id } });
          return { status: "success" };
        } catch (error) {
          fastify.log.error({ err: error }, "Failed to remove friend:");
          reply.code(500);
          return { status: "error", message: "Failed to remove friend" };
        }
      }
    );
  });
}
