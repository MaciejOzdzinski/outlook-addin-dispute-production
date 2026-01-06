export class HttpError extends Error {
    status;
    problem;
    response;
    constructor(message, status, problem, response) {
        super(message);
        this.name = "HttpError";
        this.status = status;
        this.problem = problem;
        this.response = response;
    }
}
export class HttpClient {
    refreshing = null;
    baseUrl;
    getAccessToken;
    refreshToken;
    defaultHeaders;
    timeoutMs;
    retry;
    credentials;
    constructor(opts) {
        this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
        this.getAccessToken = opts.getAccessToken;
        this.refreshToken = opts.refreshToken;
        this.defaultHeaders = opts.defaultHeaders ?? { Accept: "application/json" };
        this.timeoutMs = opts.timeoutMs ?? 12000;
        this.retry = opts.retry;
        this.credentials = opts.credentials;
    }
    get(path, init) {
        return this.request("GET", path, undefined, init);
    }
    post(path, body, init) {
        return this.request("POST", path, body, init);
    }
    put(path, body, init) {
        return this.request("PUT", path, body, init);
    }
    patch(path, body, init) {
        return this.request("PATCH", path, body, init);
    }
    delete(path, init) {
        return this.request("DELETE", path, undefined, init);
    }
    buildUrl(path, query) {
        const u = new URL(path.startsWith("http")
            ? path
            : `${this.baseUrl}/${path.replace(/^\/+/, "")}`);
        if (query) {
            Object.entries(query).forEach(([k, v]) => {
                if (v === undefined || v === null)
                    return;
                if (Array.isArray(v))
                    v.forEach((item) => u.searchParams.append(k, String(item)));
                else
                    u.searchParams.set(k, String(v));
            });
        }
        return u.toString();
    }
    withTimeout(signal) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(new DOMException("Timeout", "TimeoutError")), this.timeoutMs);
        const cleanup = () => clearTimeout(id);
        if (signal) {
            signal.addEventListener("abort", () => controller.abort(signal.reason), {
                once: true,
            });
        }
        return { signal: controller.signal, cleanup };
    }
    async request(method, path, body, init) {
        const url = this.buildUrl(path, init?.query);
        const headers = new Headers(this.defaultHeaders);
        if (body !== undefined &&
            !(body instanceof FormData) &&
            !(body instanceof Blob)) {
            headers.set("Content-Type", "application/json");
        }
        // token
        const token = this.getAccessToken ? await this.getAccessToken() : null;
        if (token)
            headers.set("Authorization", `Bearer ${token}`);
        const doFetch = async () => {
            const { signal, cleanup } = this.withTimeout(init?.signal ?? undefined);
            try {
                return await fetch(url, {
                    method,
                    headers,
                    body: body === undefined
                        ? undefined
                        : body instanceof FormData || body instanceof Blob
                            ? body
                            : JSON.stringify(body),
                    credentials: this.credentials,
                    ...init,
                    signal,
                });
            }
            finally {
                cleanup();
            }
        };
        const shouldRetry = (res, err, attempt) => {
            if (!this.retry || attempt >= (this.retry.attempts ?? 0))
                return false;
            if (method !== "GET" && method !== "HEAD")
                return false;
            if (err)
                return true;
            if (!res)
                return false;
            return [408, 425, 429, 500, 502, 503, 504].includes(res.status);
        };
        let attempt = 0;
        let res = null;
        // retry loop
        // eslint-disable-next-line no-constant-condition
        while (true) {
            let error = null;
            try {
                res = await doFetch();
                // automatyczne odświeżenie tokena przy 401 (jeśli skonfigurowane)
                if (res.status === 401 && this.refreshToken) {
                    if (!this.refreshing)
                        this.refreshing = this.refreshToken().finally(() => (this.refreshing = null));
                    const newToken = await this.refreshing; // mutex przeciwko "thundering herd"
                    if (newToken) {
                        headers.set("Authorization", `Bearer ${newToken}`);
                        res = await doFetch();
                    }
                }
            }
            catch (e) {
                error = e;
            }
            if (shouldRetry(res, error, attempt)) {
                await new Promise((r) => setTimeout(r, (this.retry?.backoffMs ?? 500) * Math.pow(2, attempt)));
                attempt++;
                continue;
            }
            if (error) {
                throw new HttpError(error.message, 0);
            }
            break;
        }
        if (!res)
            throw new HttpError("Brak odpowiedzi", 0);
        if (res.status === 204)
            return undefined;
        const contentType = res.headers.get("Content-Type")?.toLowerCase() ?? "";
        const isJson = contentType.includes("application/json") || contentType.includes("+json");
        if (!res.ok) {
            let problem;
            try {
                problem = isJson ? await res.json() : undefined;
            }
            catch {
                /* ignore */
            }
            const message = problem?.title || problem?.detail || `HTTP ${res.status}`;
            throw new HttpError(message, res.status, problem, res);
        }
        if (isJson) {
            return (await res.json());
        }
        // fallback na blob/tekst
        const isBlob = contentType.startsWith("application/") ||
            contentType.startsWith("image/") ||
            contentType.startsWith("video/");
        return (isBlob ? await res.blob() : await res.text());
    }
}
