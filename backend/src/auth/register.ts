
import { password } from "bun";
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";

export async function registerUser(fastify: FastifyInstance, data) {
  const hashed = await password.hash(data.password);

  const user = await fastify.prisma.user.create({
    data: {
      email: data.email,
      password: hashed,
    },
  });

  return user;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function loginUser(fastify: FastifyInstance, data) {
  const user = await fastify.prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) throw new Error("Invalid credentials");

  const valid = await password.verify(user.password, data.password);
  if (!valid) throw new Error("Invalid credentials");

  const token = fastify.jwt.sign({ id: user.id });
  return { token };
}
