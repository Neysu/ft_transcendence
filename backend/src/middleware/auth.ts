import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

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
    const payload = fastify.jwt.verify(token);
    (request as FastifyRequest & { user?: { id?: number } }).user = payload as {
      id?: number;
    };
  } catch {
    reply.code(401);
    return reply.send({ status: "error", message: "Invalid token" });
  }
}
