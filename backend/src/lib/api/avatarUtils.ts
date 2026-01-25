import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "../prisma";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_AVATAR_PIXELS = 16_000_000; // ~16MP safety cap
const ALLOWED_FORMATS = new Set(["png", "jpeg", "webp", "gif"]);

type AvatarUploadErrorStatus = 400 | 413;

export async function validateAvatarUpload(request: { parts: () => AsyncIterable<unknown> }) {
  let file: {
    fieldname: string;
    file: NodeJS.ReadableStream;
    toBuffer: () => Promise<Buffer>;
  } | null = null;
  for await (const part of request.parts()) {
    if (typeof part !== "object" || !part) {
      continue;
    }
    const typed = part as { type?: string; fieldname?: string; file?: NodeJS.ReadableStream };
    if (typed.type !== "file") {
      continue;
    }
    if (typed.fieldname !== "avatar") {
      typed.file?.resume();
      continue;
    }
    file = part as {
      fieldname: string;
      file: NodeJS.ReadableStream;
      toBuffer: () => Promise<Buffer>;
    };
    break;
  }

  if (!file) {
    return {
      ok: false as const,
      status: 400 as AvatarUploadErrorStatus,
      message: "Avatar file is required (field name: avatar)",
    };
  }

  const buffer = await file.toBuffer();
  if (buffer.length > MAX_AVATAR_BYTES) {
    return {
      ok: false as const,
      status: 413 as AvatarUploadErrorStatus,
      message: "Avatar file too large (max 5MB)",
    };
  }

  const metadata = await sharp(buffer, { limitInputPixels: MAX_AVATAR_PIXELS }).metadata();
  if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
    return {
      ok: false as const,
      status: 400 as AvatarUploadErrorStatus,
      message: "Invalid file type (allowed: png, jpeg, webp, gif)",
    };
  }

  const isAnimatedGif = metadata.format === "gif" && (metadata.pages ?? 1) > 1;
  const format = metadata.format === "gif" ? "gif" : "other";

  return {
    ok: true as const,
    buffer,
    format,
    animated: isAnimatedGif,
  };
}

async function saveAvatarForUser(
  userId: number,
  buffer: Buffer,
  format: "gif" | "other",
  animated: boolean,
) {
  const userDir = path.join(process.cwd(), "public", String(userId));
  await mkdir(userDir, { recursive: true });
  const ext = format === "gif" && animated ? "gif" : "webp";
  const filename = `avatar-${Date.now()}.${ext}`;
  const filePath = path.join(userDir, filename);

  const pipeline = sharp(buffer, {
    limitInputPixels: MAX_AVATAR_PIXELS,
    animated: format === "gif" && animated,
  }).resize(256, 256, { fit: "cover" });

  if (format === "gif" && animated) {
    await pipeline.gif().toFile(filePath);
  } else {
    await pipeline.webp({ quality: 80 }).toFile(filePath);
  }

  return { filePath, publicPath: `/public/${userId}/${filename}` };
}

export async function replaceUserAvatar(
  userId: number,
  previousProfileImage: string | null,
  buffer: Buffer,
  format: "gif" | "other",
  animated: boolean,
) {
  const { publicPath, filePath } = await saveAvatarForUser(userId, buffer, format, animated);
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profileImage: publicPath },
      select: { id: true, username: true, profileImage: true },
    });

    if (previousProfileImage && previousProfileImage.startsWith(`/public/${userId}/`)) {
      const oldPath = path.join(process.cwd(), previousProfileImage.slice(1));
      if (oldPath !== filePath) {
        try {
          await unlink(oldPath);
        } catch {}
      }
    }

    return updatedUser;
  } catch (dbError) {
    try {
      await unlink(filePath);
    } catch {}
    throw dbError;
  }
}
