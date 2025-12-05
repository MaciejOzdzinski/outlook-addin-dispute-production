/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/httpClient.ts
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";
export type Json =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  [key: string]: unknown;
}

export interface HttpClientOptions {
  baseUrl: string;
  getAccessToken?: () => Promise<string | null> | string | null;
  refreshToken?: () => Promise<string | null>; // zwraca nowy accessToken
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number; // np. 12_000
  retry?: { attempts: number; backoffMs: number }; // tylko dla idempotentnych
  credentials?: RequestCredentials; // "include" jeśli używasz cookies/CSRF
}

export class HttpError extends Error {
  public status: number;
  public problem?: ProblemDetails;
  public response?: Response;

  constructor(
    message: string,
    status: number,
    problem?: ProblemDetails,
    response?: Response
  ) {
    super(message);
    this.name = "HttpError";

    this.status = status;
    this.problem = problem;
    this.response = response;
  }
}

export class HttpClient {
  private refreshing: Promise<string | null> | null = null;
  private baseUrl: string;
  private getAccessToken?: HttpClientOptions["getAccessToken"];
  private refreshToken?: HttpClientOptions["refreshToken"];
  private defaultHeaders: Record<string, string>;
  private timeoutMs: number;
  private retry?: HttpClientOptions["retry"];
  private credentials?: RequestCredentials;

  constructor(opts: HttpClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.getAccessToken = opts.getAccessToken;
    this.refreshToken = opts.refreshToken;
    this.defaultHeaders = opts.defaultHeaders ?? { Accept: "application/json" };
    this.timeoutMs = opts.timeoutMs ?? 12000;
    this.retry = opts.retry;
    this.credentials = opts.credentials;
  }

  get<T>(
    path: string,
    init?: RequestInit & { query?: Record<string, unknown> }
  ) {
    return this.request<T>("GET", path, undefined, init);
  }

  post<T, B = Json>(path: string, body?: B, init?: RequestInit) {
    return this.request<T>("POST", path, body, init);
  }

  put<T, B = Json>(path: string, body?: B, init?: RequestInit) {
    return this.request<T>("PUT", path, body, init);
  }

  patch<T, B = Json>(path: string, body?: B, init?: RequestInit) {
    return this.request<T>("PATCH", path, body, init);
  }

  delete<T>(path: string, init?: RequestInit) {
    return this.request<T>("DELETE", path, undefined, init);
  }

  private buildUrl(path: string, query?: Record<string, unknown>) {
    const u = new URL(
      path.startsWith("http")
        ? path
        : `${this.baseUrl}/${path.replace(/^\/+/, "")}`
    );
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (Array.isArray(v))
          v.forEach((item) => u.searchParams.append(k, String(item)));
        else u.searchParams.set(k, String(v));
      });
    }
    return u.toString();
  }

  private withTimeout(signal?: AbortSignal) {
    const controller = new AbortController();
    const id = setTimeout(
      () => controller.abort(new DOMException("Timeout", "TimeoutError")),
      this.timeoutMs
    );
    const cleanup = () => clearTimeout(id);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort(signal.reason), {
        once: true,
      });
    }
    return { signal: controller.signal, cleanup };
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    init?: RequestInit & { query?: Record<string, unknown> }
  ): Promise<T> {
    const url = this.buildUrl(path, (init as any)?.query);
    const headers = new Headers(this.defaultHeaders);
    if (
      body !== undefined &&
      !(body instanceof FormData) &&
      !(body instanceof Blob)
    ) {
      headers.set("Content-Type", "application/json");
    }

    // token
    const token = this.getAccessToken ? await this.getAccessToken() : null;
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const doFetch = async (): Promise<Response> => {
      const { signal, cleanup } = this.withTimeout(init?.signal ?? undefined);
      try {
        return await fetch(url, {
          method,
          headers,
          body:
            body === undefined
              ? undefined
              : body instanceof FormData || body instanceof Blob
              ? (body as any)
              : JSON.stringify(body),
          credentials: this.credentials,
          ...init,
          signal,
        });
      } finally {
        cleanup();
      }
    };

    const shouldRetry = (
      res: Response | null,
      err: unknown,
      attempt: number
    ) => {
      if (!this.retry || attempt >= (this.retry.attempts ?? 0)) return false;
      if (method !== "GET" && method !== "HEAD") return false;
      if (err) return true;
      if (!res) return false;
      return [408, 425, 429, 500, 502, 503, 504].includes(res.status);
    };

    let attempt = 0;
    let res: Response | null = null;
    // retry loop
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let error: unknown = null;
      try {
        res = await doFetch();

        // automatyczne odświeżenie tokena przy 401 (jeśli skonfigurowane)
        if (res.status === 401 && this.refreshToken) {
          if (!this.refreshing)
            this.refreshing = this.refreshToken().finally(
              () => (this.refreshing = null)
            );
          const newToken = await this.refreshing; // mutex przeciwko "thundering herd"
          if (newToken) {
            headers.set("Authorization", `Bearer ${newToken}`);
            res = await doFetch();
          }
        }
      } catch (e) {
        error = e;
      }

      if (shouldRetry(res, error, attempt)) {
        await new Promise((r) =>
          setTimeout(r, (this.retry?.backoffMs ?? 500) * Math.pow(2, attempt))
        );
        attempt++;
        continue;
      }

      if (error) {
        throw new HttpError((error as Error).message, 0);
      }
      break;
    }

    if (!res!) throw new HttpError("Brak odpowiedzi", 0);

    if (res.status === 204) return undefined as unknown as T;

    const contentType = res.headers.get("Content-Type")?.toLowerCase() ?? "";
    const isJson =
      contentType.includes("application/json") || contentType.includes("+json");

    if (!res.ok) {
      let problem: ProblemDetails | undefined;
      try {
        problem = isJson ? await res.json() : undefined;
      } catch {
        /* ignore */
      }
      const message = problem?.title || problem?.detail || `HTTP ${res.status}`;
      throw new HttpError(message, res.status, problem, res);
    }

    if (isJson) {
      return (await res.json()) as T;
    }
    // fallback na blob/tekst
    const isBlob =
      contentType.startsWith("application/") ||
      contentType.startsWith("image/") ||
      contentType.startsWith("video/");
    return (isBlob ? await res.blob() : await res.text()) as unknown as T;
  }
}
