import type { FastifyInstance } from "fastify";
import { findUserByUsername } from "../../../lib/api/userUtils";
import { normalizeProfileImageUrl } from "../../../lib/api/avatarUtils";
import { UserUsernameParamSchema } from "../../../lib/api/schemasZod";
import { parseOrReply } from "../../../lib/api/validation";
import { getUserByUsernameSchema } from "../../../swagger/schemas";
import { getUserGameStats } from "../../../lib/api/gameStats";

export async function getUserByUsername(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
  fastify.get("/:username/stats", async (request, reply) => {
      try {
        const params = parseOrReply(UserUsernameParamSchema, request.params, reply);
        if (!params) {
          return;
        }
        const user = await findUserByUsername(params.username, { id: true });
        if (!user) {
          reply.code(404);
          return { status: "error", message: "User not found" };
        }
        return getUserGameStats(user.id);
      } catch (error) {
        fastify.log.error({ err: error }, "Failed to fetch user stats:");
        reply.code(500);
        return { status: "error", message: "Failed to fetch user stats" };
      }
    });

  fastify.get("/:username", { schema: getUserByUsernameSchema }, async (request, reply) => {
      try {
        const params = parseOrReply(UserUsernameParamSchema, request.params, reply);
        if (!params) {
          return;
        }
        const user = await findUserByUsername(params.username, {
          id: true,
          username: true,
          profileImage: true,
          profileText: true,
        });
        if (!user) {
          reply.code(404);
          return { status: "error", message: "User not found" };
        }
        return {
          id: user.id,
          username: user.username,
          profileText: user.profileText,
          profileImage: normalizeProfileImageUrl(user.profileImage, {
            logger: fastify.log,
            userId: user.id,
            context: "get-user-by-username",
          }),
        };
      } catch (error) {
        fastify.log.error({ err: error }, "Failed to fetch user:");
        reply.code(500);
        return { status: "error", message: "Failed to fetch user" };
      }
    });
  });
}
