# backend


To run:

First, install NVM if you don’t have it yet:
```bash

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
nvm install 22
nvm use 22
bun install # This inatll all dependencies
bun prisma migrate dev  # This creates the database and generates the necessary migration files and Prisma client
bun run src/test.ts  # This runs a small test that creates a default user and a post to verify the database setup
bun prisma studio  # Opens Prisma Studio to view and edit the database
```

```bash
bun run src/server.js

```


# command prisma a faire si un changement dans les schema de la db
```
bun prisma generate
```
This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

