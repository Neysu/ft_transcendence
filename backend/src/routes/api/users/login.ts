
import type { FastifyInstance } from "fastify";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcrypt";
import { LoginSchema } from "../../../lib/api/schemasZod";
import { parseOrReply } from "../../../lib/api/validation";
import { loginSchema } from "../../../swagger/schemas";
import crypto from "crypto";

export async function loginUser(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {
    // POST /api/user/login → login utilisateur
    fastify.post("/login", { schema: loginSchema }, async (request, reply) => {
      try {
        const body = parseOrReply(LoginSchema, request.body, reply);
        if (!body) {
          return;
        }
        const { email, username, password } = body;
        const orFilters = [];
        if (email) {
          orFilters.push({ email });
        }
        if (username) {
          orFilters.push({ username });
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: orFilters,
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

        // Issue access token
        const token = fastify.jwt.sign({ id: user.id, username: user.username });

        // Generate and store refresh token (in-memory for demo)
        const refreshToken = crypto.randomBytes(32).toString("hex");
        if (!fastify.refreshTokens) fastify.refreshTokens = new Set();
        fastify.refreshTokens.add(refreshToken);
        reply.setCookie("refreshToken", refreshToken, { httpOnly: true, path: "/" });

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
