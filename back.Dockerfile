FROM oven/bun:latest

WORKDIR /app

COPY ./backend/package.json .
RUN bun install

COPY backend/ .

EXPOSE 3000

RUN bun prisma migrate dev --schema="./prisma/schema.prisma" --name="test"
RUN bun prisma generate
CMD ["bun", "run", "index.ts"]
