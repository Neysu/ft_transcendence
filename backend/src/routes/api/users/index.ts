import type { FastifyInstance } from "fastify";

import { getUsers } from "./getUsers";
import { getUserById } from "./getUserById";
import { updateUser } from "./updateUser";
import { createUser } from "./createUser";

export async function Users(fastify: FastifyInstance) {
  fastify.register(getUsers);
  fastify.register(getUserById);
  fastify.register(updateUser);
  fastify.register(createUser);
}