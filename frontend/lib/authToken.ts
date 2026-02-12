export function getUserIdFromStoredToken() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(window.atob(padded)) as { id?: number };
    if (typeof payload.id === "number" && Number.isInteger(payload.id) && payload.id > 0) {
      return payload.id;
    }
    return null;
  } catch {
    return null;
  }
}
