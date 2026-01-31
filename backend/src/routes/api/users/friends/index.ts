import type { FastifyInstance } from "fastify";
import { requestFriend } from "./requestFriend";
import { acceptFriend } from "./acceptFriend";
import { rejectFriend } from "./rejectFriend";
import { cancelFriendRequest } from "./cancelFriendRequest";
import { getFriends } from "./getFriends";
import { getFriendRequests } from "./getFriendRequests";
import { getFriendRequestsSent } from "./getFriendRequestsSent";

export async function Friends(fastify: FastifyInstance) {
  fastify.register(requestFriend);
  fastify.register(acceptFriend);
  fastify.register(rejectFriend);
  fastify.register(cancelFriendRequest);
  fastify.register(getFriends);
  fastify.register(getFriendRequests);
  fastify.register(getFriendRequestsSent);
}
