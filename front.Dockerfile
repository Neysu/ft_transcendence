FROM oven/bun AS builder
WORKDIR /app

COPY ./frontend/package.json ./
RUN bun install

COPY ./frontend/ .
RUN bun next build

FROM oven/bun
WORKDIR /app

COPY ./frontend/ .

CMD ["bun", "start"]
