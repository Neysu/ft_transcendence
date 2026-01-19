import type { FastifyInstance } from "fastify";

import { getUsers } from "./getUsers";
import { getMe } from "./getMe";
import { getUserById } from "./getUserById";
import { updateUser } from "./updateUser";
import { createUser } from "./createUser";
import { deleteUser } from "./deleteUser";
import { loginUser } from "./login";
import { getMyProfilePicture } from "./avatar/getMyProfilePicture";
import { getProfilePicture } from "./avatar/getProfilePicture";
import { updateAvatar } from "./avatar/updateAvatar";

export async function Users(fastify: FastifyInstance) {
  fastify.register(getUsers);
  fastify.register(getMe);
  fastify.register(getUserById);
  fastify.register(updateUser);
  fastify.register(createUser);
  fastify.register(loginUser);
  fastify.register(getMyProfilePicture);
  fastify.register(getProfilePicture);
  fastify.register(updateAvatar);
  fastify.register(deleteUser);
}
