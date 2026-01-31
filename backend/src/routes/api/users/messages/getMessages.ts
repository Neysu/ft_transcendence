import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../lib/prisma";
import { MessagesParamsSchema, MessagesQuerySchema } from "../../../../lib/api/schemasZod";
import { parseOrReply } from "../../../../lib/api/validation";
import { getMessagesSchema } from "../../../../swagger/schemas";
import { authMiddleware } from "../../../../middleware/auth";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function getMessages(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    // GET /api/user/messages/:userId → historique des messages
    fastify.get(
      "/:userId",
      { schema: getMessagesSchema, preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
      async (request, reply) => {
        try {
          const params = parseOrReply(MessagesParamsSchema, request.params, reply);
          if (!params) {
            return;
          }
          const query = parseOrReply(MessagesQuerySchema, request.query ?? {}, reply);
          if (!query) {
            return;
          }

          const authUser = (request as { user?: { id?: number } }).user;
          const authUserId = authUser?.id;
          if (typeof authUserId !== "number") {
            reply.code(401);
            return { status: "error", message: "Missing token" };
          }

          if (authUserId === params.userId) {
            reply.code(400);
            return { status: "error", message: "Invalid userId" };
          }

          const relation = await prisma.friendship.findFirst({
            where: {
              status: "ACCEPTED",
              OR: [
                { requesterId: authUserId, addresseeId: params.userId },
                { requesterId: params.userId, addresseeId: authUserId },
              ],
            },
            select: { id: true },
          });

          if (!relation) {
            reply.code(403);
            return { status: "error", message: "Not friends" };
          }

          const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
          const cursor = query.cursor;

          if (cursor) {
            const cursorRow = await prisma.message.findFirst({
              where: {
                id: cursor,
                OR: [
                  { senderId: authUserId, receiverId: params.userId },
                  { senderId: params.userId, receiverId: authUserId },
                ],
              },
              select: { id: true },
            });
            if (!cursorRow) {
              reply.code(400);
              return { status: "error", message: "Invalid cursor" };
            }
          }

          const rows = await prisma.message.findMany({
            where: {
              OR: [
                { senderId: authUserId, receiverId: params.userId },
                { senderId: params.userId, receiverId: authUserId },
              ],
            },
            orderBy: { id: "asc" },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            select: {
              id: true,
              content: true,
              createdAt: true,
              senderId: true,
              receiverId: true,
            },
          });

          let nextCursor: number | null = null;
          if (rows.length > limit) {
            const next = rows.pop();
            nextCursor = next ? next.id : null;
          }

          return { messages: rows, nextCursor };
        } catch (error) {
          fastify.log.error({ err: error }, "Failed to fetch messages:");
          reply.code(500);
          return { status: "error", message: "Failed to fetch messages" };
        }
      }
    );
  });
}
