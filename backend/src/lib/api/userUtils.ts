import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export async function findUserByIdOrUsername(
  idOrUsername: string,
  select: Prisma.UserSelect = { id: true, username: true, email: true }
) {
  const isNumericId = /^[0-9]+$/.test(idOrUsername);
  let user = null;

  if (isNumericId) {
    user = await prisma.user.findUnique({
      where: { id: Number(idOrUsername) },
      select,
    });
  }

  if (!user) {
    user = await prisma.user.findUnique({
      where: { username: idOrUsername },
      select,
    });
  }

  return (user);
}

export async function findUserByUsername(
  username: string,
  select: Prisma.UserSelect = { id: true, username: true, email: true },
) {
  return prisma.user.findUnique({
    where: { username },
    select,
  });
}

export async function userExistsByEmailOrUsername(email?: string, username?: string) {
  if (!email && !username) {
    return (false);
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
    select: { id: true },
  });

  return Boolean(user);
}
