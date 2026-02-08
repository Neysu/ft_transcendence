import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../lib/prisma";
import { FriendRequestTargetSchema } from "../../../../lib/api/schemasZod";
import { parseOrReply } from "../../../../lib/api/validation";
import { friendRequestSchema } from "../../../../swagger/schemas";
import { authMiddleware } from "../../../../middleware/auth";

type FriendshipTx = {
  friendship: typeof prisma.friendship;
};

export async function requestFriend(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    // POST /api/user/friends/request → envoyer une demande d'ami
    fastify.post("/request", { schema: friendRequestSchema, preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
      async (request, reply) => {
        try {
          const body = parseOrReply(FriendRequestTargetSchema, request.body, reply);
          if (!body) {
            return;
          }

          const authUser = (request as { user?: { id?: number } }).user;
          const authUserId = authUser?.id;
          if (typeof authUserId !== "number") {
            reply.code(401);
            return { status: "error", message: "Missing token" };
          }

          const target = body.toUserId
            ? await prisma.user.findUnique({
                where: { id: body.toUserId },
                select: { id: true },
              })
            : await prisma.user.findFirst({
                where: {
                  username: {
                    equals: body.toUsername,
                  },
                },
                select: { id: true },
              });

          if (!target) {
            reply.code(404);
            return { status: "error", message: "User not found" };
          }

          if (authUserId === target.id) {
            reply.code(400);
            return { status: "error", message: "Cannot add yourself" };
          }

          const outcome = await prisma.$transaction(async (tx: FriendshipTx) => {
            const existing = await tx.friendship.findFirst({
              where: {
                OR: [
                  { requesterId: authUserId, addresseeId: target.id },
                  { requesterId: target.id, addresseeId: authUserId },
                ],
              },
              select: { id: true, status: true, requesterId: true },
            });

            if (existing) {
              if (existing.status === "PENDING" && existing.requesterId === target.id) {
                await tx.friendship.update({
                  where: { id: existing.id },
                  data: { status: "ACCEPTED" },
                });
                return { status: "autoAccepted" as const };
              }
              return { status: "exists" as const, existing };
            }

            await tx.friendship.create({
              data: {
                requesterId: authUserId,
                addresseeId: target.id,
              },
            });

            return { status: "created" as const };
          });

          if (outcome.status === "autoAccepted") {
            return { status: "success", message: "Friend request accepted" };
          }
          if (outcome.status === "exists") {
            reply.code(409);
            return {
              status: "error",
              message:
                outcome.existing.status === "ACCEPTED"
                  ? "Already friends"
                  : "Friend request already exists",
            };
          }

          return { status: "success" };
        } catch (error) {
          if (error && typeof error === "object" && "code" in error) {
            const prismaError = error as { code?: string };
            if (prismaError.code === "P2002") {
              reply.code(409);
              return { status: "error", message: "Friend request already exists" };
            }
          }

          fastify.log.error({ err: error }, "Failed to send friend request:");
          reply.code(500);
          return { status: "error", message: "Failed to send friend request" };
        }
      }
    );
  });
}
