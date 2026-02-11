FROM oven/bun:latest

WORKDIR /app

ENV PORT=8080
EXPOSE 8080

COPY ../frontend/package.json ./
RUN bun install

COPY ../frontend/ .
RUN bun next build

CMD ["bun", "next", "start"]
