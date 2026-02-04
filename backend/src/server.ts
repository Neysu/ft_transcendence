import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import websocket from "@fastify/websocket";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "./lib/prisma";
import apiRoutes from "./routes/api/index";
import wsRoutes from "./ws";

export async function buildServer() {
  const fastify = Fastify({ logger: true , trustProxy: true});
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const cookiesSecret = process.env.COOKIES_SECRET;
  const jwtSecret = process.env.JWT_SECRET;
  if (!process.env.NODE_ENV) {
    console.warn("NODE_ENV is not set; defaulting to development behavior");
  }
  if (!cookiesSecret || !jwtSecret) {
    throw new Error("COOKIES_SECRET and JWT_SECRET must be set");
  }

  fastify.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  fastify.register(cookie, {
    secret: cookiesSecret,
  });

  fastify.register(jwt, {
    secret: jwtSecret,
    sign: { expiresIn: "15m" },
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

  fastify.register(websocket, {
    options: {
      handleProtocols: (protocols) => {
        if (!protocols || protocols.size === 0) {
          return false;
        }
        const protocol = protocols.values().next().value;
        return protocol ?? false;
      },
    },
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
  
  await fastify.register(wsRoutes, { prefix: "/ws" });

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
