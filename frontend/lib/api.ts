export class FetchJsonError extends Error {
  status: number;
  response: Response;
  body: unknown;

  constructor(message: string, status: number, response: Response, body: unknown) {
    super(message);
    this.name = "FetchJsonError";
    this.status = status;
    this.response = response;
    this.body = body;
  }
}

type FetchJsonOptions = {
  defaultMessage?: string;
  statusMessages?: Partial<Record<number, string>>;
};

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }
  return response.text().catch(() => null);
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: FetchJsonOptions,
): Promise<T> {
  const response = await fetch(input, init);
  const body = await parseResponseBody(response);

  if (!response.ok) {
    const statusMessage = options?.statusMessages?.[response.status];
    const serverMessage =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : null;
    const textBody = typeof body === "string" ? body.trim() : "";
    const isHtml = textBody.startsWith("<!DOCTYPE") || textBody.startsWith("<html");
    const message =
      statusMessage ||
      serverMessage ||
      (textBody && !isHtml ? textBody : null) ||
      options?.defaultMessage ||
      `Request failed (${response.status})`;

    throw new FetchJsonError(message, response.status, response, body);
  }

  return body as T;
}
