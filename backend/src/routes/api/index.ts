import type { FastifyInstance } from "fastify";
import { Health } from "./health";
import { Users } from "./users/index";
import { Game } from "./game";

export default async function apiRoutes(fastify: FastifyInstance) {
    fastify.register(Health);
    fastify.register(Users, { prefix: "/user" });
    fastify.register(Game, { prefix: "/game" });
}