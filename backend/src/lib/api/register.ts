
import type { FastifyInstance } from "fastify";
import sharp from "sharp";
import { prisma } from "../prisma";
import { RegisterSchema } from "./schemasZod";
import bcrypt from "bcrypt";

export async function createDefaultAvatar(username: string): Promise<string | null> {
  try {
    const defaultAvatar = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${username}`;
    const response = await fetch(defaultAvatar);

    if (!response.ok) {
    throw new Error(`Erreur téléchargement avatar: ${response.statusText}`);
  }

  const svgText = await response.text();
  const buffer = Buffer.from(svgText, 'utf-8');

  const webpBuffer = await sharp(buffer, { density: 300 })
    .resize(256, 256)
    .webp({ quality: 80 })
    .toBuffer();

  const base64Image = webpBuffer.toString('base64');

  return (`data:image/webp;base64,${base64Image}`);
  } catch (error) {
    console.error("Failed to create default avatar:", error);
    return (null);
  }
}

export async function registerUser(
  fastify: FastifyInstance,
  data: { username: string; email: string; password: string }) {
  const validation = RegisterSchema.parse(data);

  const hashed = await bcrypt.hash(validation.password, 10);
  const avatar = await createDefaultAvatar(validation.username);
  if (!avatar) {
    throw new Error("Failed to create default avatar");
  }

  const user = await prisma.user.create({
    data: {
      username: validation.username,
      email: validation.email,
      password: hashed,
      profileImage: avatar ?? null,
    },
  });

  return (user);
}
