export const DEFAULT_AVATAR_PATH = "/public/default_avatar.png";

export function resolveAvatarUrl(profileImage?: string | null) {
  const source = profileImage || DEFAULT_AVATAR_PATH;
  if (
    source.startsWith("http://") ||
    source.startsWith("https://") ||
    source.startsWith("data:") ||
    source.startsWith("blob:")
  ) {
    return source;
  }
  if (source.startsWith("/")) {
    return source;
  }
  return `/${source}`;
}
