import type { FastifyReply } from "fastify";
import type { ZodSchema } from "zod";

export function parseOrReply<T>(
  schema: ZodSchema<T>,
  data: unknown,
  reply: FastifyReply
): T | null {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    reply.code(400);
    reply.send({
      status: "error",
      message: "Invalid payload",
      issues: parsed.error.issues,
    });
    return null;
  }

  return parsed.data;
}
