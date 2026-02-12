FROM oven/bun:latest

WORKDIR /app

COPY ../backend/package.json .
RUN bun install

COPY ../backend/ .

ENV DATABASE_URL="file:/app/data/database.sqlite"

EXPOSE 3000

COPY docker/back_entrypoint.sh /usr/bin/entrypoint.sh
RUN chmod +x /usr/bin/entrypoint.sh

ENTRYPOINT [ "/usr/bin/entrypoint.sh" ]
CMD [ "bun", "run", "src/server.ts" ]
