import type { FastifyInstance } from 'fastify';
import { prisma } from '../../../lib/prisma';

export async function createUser(fastify: FastifyInstance) {
  fastify.register(async function (fastify) {

    // POST /api/user/ → créer un utilisateur
     fastify.post("/", async (request, reply) => {
      try {
        const { username, email, password } = request.body as { username: string; email: string, password: string };
        const newpassword = await Bun.password.hash(password);
        const newUser = await prisma.user.create({
          data: { username, email, password: newpassword },
          select: { id: true, username: true, email: true },
        });
        return newUser;
      } catch (error) {
        fastify.log.error({ err: error }, "Failed to create user:");
        reply.code(500);
        return { status: "error", message: "Failed to create user" };
      }
    });
  });
}