import type { FastifyInstance } from "fastify";
import { prisma } from "../../../../lib/prisma";
import { authMiddleware } from "../../../../middleware/auth";
import { getFriendRequestsSchema } from "../../../../swagger/schemas";
import { getMutualFriendCountsForUsers } from "../../../../lib/api/friendUtils";

type ReceivedFriendRequestRow = {
  id: number;
  status: string;
  createdAt: Date;
  requester: {
    id: number;
    username: string;
    profileImage: string | null;
  };
};

export async function getFriendRequests(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    // GET /api/user/friends/requests → demandes reçues
    fastify.get("/requests", { schema: getFriendRequestsSchema, preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
      async (request, reply) => {
        try {
          const authUser = (request as { user?: { id?: number } }).user;
          if (!authUser?.id) {
            reply.code(401);
            return { status: "error", message: "Missing token" };
          }

          const requests: ReceivedFriendRequestRow[] = await prisma.friendship.findMany({
            where: {
              status: "PENDING",
              addresseeId: authUser.id,
            },
            select: {
              id: true,
              status: true,
              createdAt: true,
              requester: { select: { id: true, username: true, profileImage: true } },
            },
            orderBy: { createdAt: "desc" },
          });

          const requesterIds = requests.map((request) => request.requester.id);
          const mutualCounts = await getMutualFriendCountsForUsers(authUser.id, requesterIds);

          const mapped = requests.map((request) => ({
            id: request.id,
            status: request.status,
            createdAt: request.createdAt,
            user: request.requester,
            mutualFriendsCount: mutualCounts[request.requester.id] ?? 0,
          }));

          return { requests: mapped };
        } catch (error) {
          fastify.log.error({ err: error }, "Failed to fetch friend requests:");
          reply.code(500);
          return { status: "error", message: "Failed to fetch friend requests" };
        }
      }
    );
  });
}
