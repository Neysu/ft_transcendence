import type { FastifyInstance } from "fastify";
import { findUserByIdOrUsername } from "../../../lib/api/userUtils";
import { getUserByIdSchema } from "../../../swagger/schemas";

export async function getUserById(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {

  // GET /api/user/:id → récupérer un utilisateur par son id
  fastify.get("/:id", { schema: getUserByIdSchema }, async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = await findUserByIdOrUsername(id, {
          id: true,
          username: true,
          email: true,
        });
        if (!user) {
          reply.code(404);
          return { status: "error", message: "User not found" };
        }
        return (user);
      } catch (error) {
        fastify.log.error({ err: error }, "Failed to fetch user:");
        reply.code(500);
        return { status: "error", message: "Failed to fetch user" };
      }
    });
  });
}
