import type { FastifyInstance } from 'fastify';
import { registerUser } from '../../../lib/api/register';
import { RegisterSchema } from "../../../lib/api/schemasZod";
import { parseOrReply } from "../../../lib/api/validation";
import { userExistsByEmailOrUsername } from '../../../lib/api/userUtils';
import { createUserSchema } from '../../../swagger/schemas';

export async function createUser(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {

    // POST /api/user → créer un utilisateur
    fastify.post("/", { schema: createUserSchema }, async (request, reply) => {
      try {
        const body = parseOrReply(RegisterSchema, request.body, reply);
        if (!body) {
          return;
        }

        const { email, username } = body;
        const exists = await userExistsByEmailOrUsername(email, username);
        if (exists) {
          reply.code(409);
          return { status: "error", message: "User already exists" };
        }

        const user = await registerUser(fastify, body);

        return reply.code(201).send({
          id: user.id,
          username: user.username,
          email: user.email,
        });

      } catch (error) {
        if (error && typeof error === "object" && "code" in error) {
          const prismaError = error as { code?: string };
          if (prismaError.code === "P2002") {
            reply.code(409);
            return { status: "error", message: "User already exists" };
          }
        }

        fastify.log.error({ err: error }, "Failed to create user:");
        reply.code(500);
        return { status: "error", message: "Failed to create user" };
      }
    });
  });
}
