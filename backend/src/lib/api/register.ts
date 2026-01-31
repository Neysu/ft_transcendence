
import type { FastifyInstance } from "fastify";
import sharp from "sharp";
import { prisma } from "../prisma";
import { DEFAULT_AVATAR_URL } from "./avatarUtils";
import bcrypt from "bcrypt";

const AVATAR_REQUEST_TIMEOUT_MS = 2500;
const AVATAR_REQUEST_RETRIES = 1;

async function fetchWithTimeoutRetry(url: string, { timeoutMs, retries }: { timeoutMs: number; retries: number },) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Erreur téléchargement avatar: ${response.statusText}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt >= retries) {
        throw error;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError ?? new Error("Erreur téléchargement avatar");
}

export async function createDefaultAvatar(username: string): Promise<string> {
  try {
    const seed = encodeURIComponent(username);
    const defaultAvatar = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${seed}`;
    const response = await fetchWithTimeoutRetry(defaultAvatar, {
      timeoutMs: AVATAR_REQUEST_TIMEOUT_MS,
      retries: AVATAR_REQUEST_RETRIES,
    });

    const svgText = await response.text();
    const buffer = Buffer.from(svgText, "utf-8");

    const webpBuffer = await sharp(buffer, { density: 300 })
      .resize(256, 256)
      .webp({ quality: 80 })
      .toBuffer();

    const base64Image = webpBuffer.toString("base64");

    return `data:image/webp;base64,${base64Image}`;
  } catch (error) {
    console.error("Failed to create default avatar:", error);
    return (DEFAULT_AVATAR_URL);
  }
}

export async function registerUser(
  fastify: FastifyInstance,
  data: { username: string; email: string; password: string }) {
  const hashed = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      password: hashed,
      profileImage: DEFAULT_AVATAR_URL,
    },
  });

  void createDefaultAvatar(data.username)
    .then((avatar) => {
      if (!avatar || avatar === DEFAULT_AVATAR_URL) {
        return;
      }
      return prisma.user.update({
        where: { id: user.id },
        data: { profileImage: avatar },
      });
    })
    .catch((error) => {
      fastify.log.error({ err: error }, "Failed to generate default avatar");
    });

  return (user);
}
