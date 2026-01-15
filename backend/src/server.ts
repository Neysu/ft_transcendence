import Fastify from "fastify";
import { Prisma } from "@prisma/client";
import cookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import { prisma } from "./lib/prisma";
import apiRoutes from "./routes/api/index";

const fastify = Fastify({ logger: true , trustProxy: true});

async function buildServer() {
  const fastify = Fastify({ logger: true , trustProxy: true});
  fastify.register(cookie, {
    secret: process.env.COOKIES_SECRET || 'test',
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

  // await fastify.register(swagger);

  await fastify.register(apiRoutes, { prefix: "/api" });

  return (fastify);
}


async function start() {
  try {
    const fastify = await buildServer();

    fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log(`Server listening at http://localhost:3000`);

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  process.on("SIGINT" , async () => {
    await prisma.$disconnect();
    console.log("Disconnected from database");
    fastify.close();
    console.log("Server closed");
    process.exit(0);
  } );
}

start();
