import type { FastifyInstance } from "fastify";

import { getUsers } from "./getUsers";
import { getMe } from "./getMe";
import { getUserByUsername } from "./getUserByUsername";
import { updateUser } from "./updateUser";
import { createUser } from "./createUser";
import { deleteUser } from "./deleteUser";
import { loginUser } from "./login";
import { getMyProfilePicture } from "./avatar/getMyProfilePicture";
import { getProfilePicture } from "./avatar/getProfilePicture";
import { updateAvatar } from "./avatar/updateAvatar";
import { updatePassword } from "./updatePassword";
import { Friends } from "./friends";
import { Messages } from "./messages";

export async function Users(fastify: FastifyInstance) {
  fastify.register(getUsers);
  fastify.register(getMe);
  fastify.register(getUserByUsername);
  fastify.register(updateUser);
  fastify.register(updatePassword);
  fastify.register(createUser);
  fastify.register(loginUser);
  fastify.register(getMyProfilePicture);
  fastify.register(getProfilePicture);
  fastify.register(updateAvatar);
  fastify.register(Friends, { prefix: "/friends" });
  fastify.register(Messages, { prefix: "/messages" });
  fastify.register(deleteUser);
}
