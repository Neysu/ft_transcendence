import Fastify from "fastify";
import { Prisma } from "@prisma/client";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import fastifyMultipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { prisma } from "./lib/prisma";
import apiRoutes from "./routes/api/index";

export async function buildServer() {
  const fastify = Fastify({ logger: true , trustProxy: true});
  const cookiesSecret = process.env.COOKIES_SECRET;
  const jwtSecret = process.env.JWT_SECRET;
  if (!cookiesSecret || !jwtSecret) {
    throw new Error("COOKIES_SECRET and JWT_SECRET must be set");
  }

  fastify.register(cookie, {
    secret: cookiesSecret,
  });
  fastify.register(jwt, {
    secret: jwtSecret,
  });

  fastify.register(fastifyMultipart as any, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB
      files: 1,
    },
  });

  fastify.get('/cookies', async (request, reply) => {
    return request.cookies;
  });

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "ft_transcendence API",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });
  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });

  await fastify.register(apiRoutes, { prefix: "/api" });

  return (fastify);
}


export async function start() {
  let server: ReturnType<typeof Fastify> | null = null;
  try {
    server = await buildServer();

    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log(`Server listening at http://localhost:3000`);

  } catch (err) {
    if (server) {
      server.log.error(err);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}`);
    await prisma.$disconnect();
    console.log("Disconnected from database");
    if (server) {
      await server.close();
      console.log("Server closed");
    }
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

if (process.env.NODE_ENV !== "test") {
	start();
}