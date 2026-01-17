import type { FastifyInstance } from "fastify";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcrypt";
import { loginSchema } from "../../../swagger/schemas";

export async function loginUser(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    // POST /api/user/login → login utilisateur
    fastify.post("/login", { schema: loginSchema }, async (request, reply) => {
      try {
        const { email, username, password } = request.body as {
          email?: string;
          username?: string;
          password?: string;
        };

        if (!password || (!email && !username)) {
          reply.code(400);
          return { status: "error", message: "Missing credentials" };
        }
        if (email && username) {
          reply.code(400);
          return { status: "error", message: "Use either email or username" };
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email }, { username }],
          },
          select: {
            id: true,
            username: true,
            email: true,
            password: true,
            profileImage: true,
          },
        });

        if (!user) {
          reply.code(401);
          return { status: "error", message: "Invalid credentials" };
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          reply.code(401);
          return { status: "error", message: "Invalid credentials" };
        }

        const token = fastify.jwt.sign({ id: user.id });
        return {
          token,
          id: user.id,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage,
        };
      } catch (error) {
        fastify.log.error({ err: error }, "Failed to login user:");
        reply.code(500);
        return { status: "error", message: "Failed to login user" };
      }
    });
  });
}
