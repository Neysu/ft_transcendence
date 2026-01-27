import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./dev.db',
  },
  migrate: {
    async datasourceUrl() {
      return process.env.DATABASE_URL ?? 'file:./dev.db';
    },
  },
});
