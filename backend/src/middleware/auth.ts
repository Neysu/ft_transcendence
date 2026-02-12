import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma";

export async function authMiddleware(
  fastify: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    reply.code(401);
    return reply.send({ status: "error", message: "Missing token" });
  }

  const token = authHeader.slice("Bearer ".length);
  try {
    const payload = fastify.jwt.verify(token) as { id?: number };
    if (!payload?.id || !Number.isInteger(payload.id) || payload.id <= 0) {
      reply.code(401);
      return reply.send({ status: "error", message: "Invalid token" });
    }
    const existingUser = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true },
    });
    if (!existingUser) {
      reply.code(401);
      return reply.send({ status: "error", message: "Invalid token" });
    }
    (request as FastifyRequest & { user?: { id?: number } }).user = { id: existingUser.id };
  } catch {
    reply.code(401);
    return reply.send({ status: "error", message: "Invalid token" });
  }
}
