import { existsSync } from "node:fs";
import { access, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "../prisma";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_AVATAR_PIXELS = 16_000_000; // ~16MP safety cap
const ALLOWED_FORMATS = new Set(["png", "jpeg", "webp", "gif"]);
export const DEFAULT_AVATAR_URL = "/public/default_avatar.png";

type AvatarUploadErrorStatus = 400 | 413;
type AvatarUploadValidationFormat = "gif" | "other";

type AvatarLogger = {
  info?: (obj: Record<string, unknown>, msg?: string) => void;
  warn?: (obj: Record<string, unknown>, msg?: string) => void;
};

type NormalizeProfileImageOptions = {
  logger?: AvatarLogger;
  userId?: number;
  context?: string;
};

function scheduleMissingAvatarCleanup(
  userId: number,
  logger: AvatarLogger | undefined,
  context: string,
) {
  void prisma.user.update({
    where: { id: userId },
    data: { profileImage: DEFAULT_AVATAR_URL },
    select: { id: true },
  }).then(() => {
    logger?.info?.(
      {
        metric: "avatar_missing_file_cleanup",
        context,
        userId,
        profileImage: DEFAULT_AVATAR_URL,
      },
      "Missing avatar cleanup applied",
    );
  }).catch((err: unknown) => {
    logger?.warn?.(
      {
        metric: "avatar_missing_file_cleanup_failed",
        context,
        userId,
        err,
      },
      "Missing avatar cleanup failed",
    );
  });
}

export function normalizeProfileImageUrl(
  profileImage: string | null,
  options?: NormalizeProfileImageOptions,
) {
  if (!profileImage) {
    return profileImage;
  }
  let normalized = profileImage;
  if (profileImage.startsWith("/public/")) {
    normalized = profileImage;
  } else {
    try {
      const parsed = new URL(profileImage);
      if (parsed.pathname.startsWith("/public/")) {
        normalized = parsed.pathname;
      }
    } catch {
      // keep original if not a URL
    }
  }

  if (normalized.startsWith("/public/")) {
    if (normalized === DEFAULT_AVATAR_URL) {
      return normalized;
    }
    const filePath = path.join(process.cwd(), normalized.slice(1));
    const exists = existsSync(filePath);
    options?.logger?.info?.(
      {
        context: options.context ?? "profile-image",
        userId: options.userId,
        profileImage: normalized,
        filePath,
        exists,
      },
      "Profile image file existence checked",
    );
    if (!exists) {
      const context = options?.context ?? "profile-image";
      options?.logger?.warn?.(
        {
          metric: "avatar_missing_file",
          context,
          userId: options.userId,
          profileImage: normalized,
          filePath,
        },
        "Profile image file not found on disk",
      );
      if (typeof options?.userId === "number") {
        scheduleMissingAvatarCleanup(options.userId, options.logger, context);
      }
      return DEFAULT_AVATAR_URL;
    }
  }
  return normalized;
}

export async function validateAvatarUpload(request: { parts: () => AsyncIterable<unknown> }) {
  let file: {
    fieldname: string;
    file: NodeJS.ReadableStream;
    toBuffer: () => Promise<Buffer>;
    mimetype?: string;
  } | null = null;
  for await (const part of request.parts()) {
    if (typeof part !== "object" || !part) {
      continue;
    }
    const typed = part as {
      type?: string;
      fieldname?: string;
      file?: NodeJS.ReadableStream;
      mimetype?: string;
    };
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
      mimetype?: string;
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

  const metadata = await sharp(buffer, { limitInputPixels: MAX_AVATAR_PIXELS, animated: true }).metadata();
  const isGifMime = file.mimetype === "image/gif";
  const detectedFormat = metadata.format ?? (isGifMime ? "gif" : undefined);
  if (!detectedFormat || !ALLOWED_FORMATS.has(detectedFormat)) {
    return {
      ok: false as const,
      status: 400 as AvatarUploadErrorStatus,
      message: "Invalid file type (allowed: png, jpeg, webp, gif)",
    };
  }

  const format = detectedFormat === "gif" ? "gif" : "other";

  return {
    ok: true as const,
    buffer,
    format: format as AvatarUploadValidationFormat,
  };
}

async function saveAvatarForUser(
  userId: number,
  buffer: Buffer,
  format: "gif" | "other",
) {
  const userDir = path.join(process.cwd(), "public", String(userId));
  await mkdir(userDir, { recursive: true });
  const ext = format === "gif" ? "gif" : "webp";
  const filename = `avatar-${Date.now()}.${ext}`;
  const filePath = path.join(userDir, filename);

  const pipeline = sharp(buffer, {
    limitInputPixels: MAX_AVATAR_PIXELS,
    animated: format === "gif",
  }).resize(256, 256, { fit: "cover" });

  if (format === "gif") {
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
) {
  const { publicPath, filePath } = await saveAvatarForUser(userId, buffer, format);
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

export async function getProfileImageOrFallback(userId: number, profileImage: string) {
  if (!profileImage.startsWith("/public/")) {
    return profileImage;
  }

  const filePath = path.join(process.cwd(), profileImage.slice(1));
  try {
    await access(filePath);
    return profileImage;
  } catch {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { profileImage: DEFAULT_AVATAR_URL },
        select: { id: true },
      });
    } catch {}
    return DEFAULT_AVATAR_URL;
  }
}
