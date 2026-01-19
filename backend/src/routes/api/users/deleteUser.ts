import type { FastifyInstance } from "fastify";
import { prisma } from "../../../lib/prisma";
import { findUserByIdOrUsername } from "../../../lib/api/userUtils";
import { UserIdParamSchema } from "../../../lib/api/schemasZod";
import { parseOrReply } from "../../../lib/api/validation";
import { deleteUserSchema } from "../../../swagger/schemas";
import { authMiddleware } from "../../../middleware/auth";

export async function deleteUser(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {

    // DELETE /api/user/:id → supprimer un utilisateur par id ou username
    fastify.delete("/:id",
      { schema: deleteUserSchema, preHandler: (req, rep) => authMiddleware(fastify, req, rep) },
      async (request, reply) => {
      try {
        const params = parseOrReply(UserIdParamSchema, request.params, reply);
        if (!params) {
          return;
        }
        const user = await findUserByIdOrUsername(params.id, {
          id: true,
          username: true,
          email: true,
        });

        if (!user) {
          reply.code(404);
          return { status: "error", message: "User not found" };
        }
        const authUser = (request as { user?: { id?: number } }).user;
        if (!authUser?.id || authUser.id !== user.id) {
          reply.code(403);
          return { status: "error", message: "Forbidden" };
        }

        await prisma.user.delete({ where: { id: user.id } });
        return { status: "success", deletedUser: user };
      } catch (error) {
        fastify.log.error({ err: error }, "Failed to delete user:");
        reply.code(500);
        return { status: "error", message: "Failed to delete user" };
      }
      }
    );
  });
}
