import type { FastifyInstance } from "fastify";

import { getUsers } from "./getUsers";
import { getUserById } from "./getUserById";
import { updateUser } from "./updateUser";
import { createUser } from "./createUser";
import { deleteUser } from "./deleteUser";
import { loginUser } from "./login";
import { getProfilePicture } from "./avatar/getProfilePicture";
import { updateAvatar } from "./avatar/updateAvatar";

export async function Users(fastify: FastifyInstance) {
  fastify.register(getUsers);
  fastify.register(getUserById);
  fastify.register(updateUser);
  fastify.register(createUser);
  fastify.register(loginUser);
  fastify.register(getProfilePicture);
  fastify.register(updateAvatar);
  fastify.register(deleteUser);
}
