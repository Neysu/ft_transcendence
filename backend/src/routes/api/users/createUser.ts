import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { registerUser } from '../../../lib/api/register';
import { userExistsByEmailOrUsername } from '../../../lib/api/userUtils';
import { createUserSchema } from '../../../swagger/schemas';

export async function createUser(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {

    // POST /api/user → créer un utilisateur
    fastify.post("/", { schema: createUserSchema }, async (request, reply) => {
      try {
        const body = request.body as {
          email?: string;
          username?: string;
          password?: string;
        };

        if (!body?.email || !body?.username || !body?.password) {
          reply.code(400);
          return { status: "error", message: "Missing required fields" };
        }

        const { email, username } = body;
        const exists = await userExistsByEmailOrUsername(email, username);
        if (exists) {
          reply.code(409);
          return { status: "error", message: "User already exists" };
        }

        const payload = {  email: body.email, username: body.username, password: body.password,
        };
        const user = await registerUser(fastify, payload);

        if (!user.profileImage) {
          reply.code(500);
          return { status: "error", message: "Failed to create default avatar" };
        }

        return reply.code(201).send({
          id: user.id,
          username: user.username,
          email: user.email,
        });

      } catch (error) {
        if (error instanceof ZodError) {
          reply.code(400);
          return { status: "error", message: "Invalid payload", issues: error.issues };
        }

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
