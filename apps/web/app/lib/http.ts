type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  headers?: HeadersInit;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
};

type ErrorResponseBody = {
  error?: string;
  message?: string;
  details?: unknown;
};

const DEFAULT_TIMEOUT_MS = 10_000;

export class HttpClientError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly details?: unknown;

  constructor(code: string, message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "HttpClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function toHeaders(headers?: HeadersInit): Headers {
  return new Headers(headers);
}

function normalizeBody(body: unknown, headers: Headers): BodyInit | undefined {
  if (body === undefined) {
    return undefined;
  }

  if (body instanceof FormData || body instanceof URLSearchParams) {
    return body;
  }

  if (typeof body === "string") {
    if (!headers.has("content-type")) {
      headers.set("content-type", "text/plain");
    }
    return body;
  }

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return JSON.stringify(body);
}

async function parseJsonOrNull(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function createRequestSignal(
  externalSignal: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal; cleanup: () => void; isTimeout: () => boolean } {
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => {
    controller.abort();
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      onExternalAbort();
    } else {
      externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      if (externalSignal) {
        externalSignal.removeEventListener("abort", onExternalAbort);
      }
    },
    isTimeout: () => timedOut,
  };
}

export async function fetchJson<T>(
  url: string,
  { method = "GET", headers, body, signal, timeoutMs = DEFAULT_TIMEOUT_MS }: RequestOptions = {},
): Promise<T> {
  const requestHeaders = toHeaders(headers);
  if (!requestHeaders.has("accept")) {
    requestHeaders.set("accept", "application/json");
  }

  const normalizedBody = normalizeBody(body, requestHeaders);
  const requestSignal = createRequestSignal(signal, timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: normalizedBody,
      signal: requestSignal.signal,
    });
  } catch (error) {
    requestSignal.cleanup();
    if (requestSignal.isTimeout()) {
      throw new HttpClientError("REQUEST_TIMEOUT", "Request timed out. Please retry.");
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new HttpClientError("REQUEST_ABORTED", "Request was aborted.");
    }
    throw new HttpClientError("NETWORK_ERROR", "Network error. Verify API connectivity and retry.");
  }

  requestSignal.cleanup();

  const data = await parseJsonOrNull(response);

  if (!response.ok) {
    const errorBody = (data ?? {}) as ErrorResponseBody;
    const code = errorBody.error ?? `HTTP_${response.status}`;
    const message = errorBody.message ?? "Unexpected error occurred.";
    throw new HttpClientError(code, message, response.status, errorBody.details);
  }

  return data as T;
}
