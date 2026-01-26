import "dotenv/config";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import crypto from "crypto";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "./lib/prisma";
import apiRoutes from "./routes/api/index";


export async function buildServer() {
  // --- JWT secret rotation logic ---
  const cookiesSecret = process.env.COOKIES_SECRET;
  let currentSecret = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
  let previousSecret = currentSecret;
  if (!cookiesSecret || !currentSecret) {
    throw new Error("COOKIES_SECRET and JWT_SECRET must be set");
  }

  // Rotate JWT secret every 30 minutes
  setInterval(() => {
    previousSecret = currentSecret;
    currentSecret = crypto.randomBytes(32).toString("hex");
    console.log("JWT secret rotated");
  }, 30 * 60 * 1000);

  const fastify = Fastify({ logger: true , trustProxy: true});
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  fastify.register(cookie, {
    secret: cookiesSecret,
  });
  // Register JWT with dynamic secret function
  fastify.register(jwt, {
    secret: async () => currentSecret,
  });

  // Custom decorator for dual-secret verification
  fastify.decorate("authenticate", async function(request, reply) {
    try {
      await request.jwtVerify({ secret: currentSecret });
    } catch (err) {
      // Try previous secret for grace period
      try {
        await request.jwtVerify({ secret: previousSecret });
      } catch (err2) {
        reply.code(401).send({ message: "Invalid or expired token" });
      }
    }
  });

  fastify.register(fastifyMultipart as any, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB
      files: 1,
    },
  });

  fastify.register(fastifyStatic, {
    root: path.join(__dirname, "..", "public"),
    prefix: "/public/",
  });

  // fastify.get("/cookies", async (request) => {
  //   return request.cookies;
  // });

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

    const port = Number(process.env.BACK_PORT) || 3000;
    const host = process.env.BACK_HOST ?? "0.0.0.0";
    await server.listen({ port, host });
    console.log(`Server listening at http://${host}:${port}`);

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
