FROM oven/bun:latest

WORKDIR /app

COPY ../backend/package.json .
RUN bun install

COPY ../backend/ .

ENV DATABASE_URL="file:/app/data/database.sqlite"

EXPOSE 3000

RUN bun prisma generate

<<<<<<< HEAD:back.Dockerfile
CMD bun prisma migrate deploy && bun run src/server.ts
=======
CMD [ "bun", "run", "src/server.ts" ]
>>>>>>> refs/remotes/origin/main:docker/back.Dockerfile
