FROM oven/bun:latest

WORKDIR /app

COPY ../backend/package.json .
RUN bun install

COPY ../backend/ .

ENV DATABASE_URL="file:/app/data/database.sqlite"

EXPOSE 3000

RUN bun prisma generate
RUN bun prisma migrate deploy

CMD [ "bun", "run", "src/server.ts" ]
