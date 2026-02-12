#!/bin/sh

if [ $PWD != "/app" ]; then
	cd /app
	echo "entering directory '/app'"
else
	echo "already in '/app'"
fi;

bun prisma generate
bun prisma migrate dev --name init

exec "$@"
