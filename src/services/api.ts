import { toast } from "react-hot-toast";
import { z, ZodSchema } from "zod";
import {
  MetaSchema,
  MessageInputSchema,
  MessageSchema,
  OrderInputSchema,
  OrderSchema,
  ProfileInputSchema,
  ProfileSchema,
  QuoteInputSchema,
  QuoteSchema,
  RequestInputSchema,
  RequestSchema,
  RequestUpdateSchema,
  type MessageInput,
  type Meta,
  type OrderInput,
  type Profile,
  type ProfileInput,
  type Quote,
  type QuoteInput,
  type RequestInput,
  type RequestUpdate,
  type ServiceMessage,
  type ServiceOrder,
  type ServiceRequest,
} from "./schemas";
import { getAccessToken, setAccessToken, withRefreshLock } from "./authSession";
import { logAuthEvent } from "./authEvents";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiClient = {
  listRequests: () => Promise<ServiceRequest[]>;
  createRequest: (input: RequestInput) => Promise<ServiceRequest>;
  updateRequest: (id: string, input: RequestUpdate) => Promise<ServiceRequest>;
  deleteRequest: (id: string) => Promise<void>;

  listQuotes: (requestId?: string) => Promise<Quote[]>;
  createQuote: (input: QuoteInput) => Promise<Quote>;

  listMessages: (threadId?: string) => Promise<ServiceMessage[]>;
  sendMessage: (input: MessageInput) => Promise<ServiceMessage>;

  listOrders: () => Promise<ServiceOrder[]>;
  updateOrderStatus: (id: string, status: string) => Promise<ServiceOrder>;

  listProfiles: () => Promise<Profile[]>;
  getProfile: (id: string) => Promise<Profile>;
  upsertProfile: (profile: ProfileInput) => Promise<Profile>;

  getMeta: () => Promise<Meta>;
};

export class ApiError extends Error {
  status?: number;
  url?: string;

  constructor(message: string, status?: number, url?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
  }
}

const defaultHeaders = { "Content-Type": "application/json" } as const;
const authBaseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

async function refreshAccessToken() {
  return withRefreshLock(async () => {
    try {
      const res = await fetch(`${authBaseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: defaultHeaders,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new ApiError(text || res.statusText, res.status, `${authBaseUrl}/auth/refresh`);
      }
      const data = await res.json();
      if (data?.accessToken) {
        setAccessToken(data.accessToken);
      }
      return data?.accessToken || null;
    } catch (error) {
      logAuthEvent({ type: "token_refresh_failed", message: error?.message || "토큰 갱신 실패" });
      window.dispatchEvent(
        new CustomEvent("auth:force-signout", {
          detail: { message: "세션이 만료되어 로그아웃되었습니다." },
        })
      );
      return null;
    }
  });
}

async function request<T>(
  url: string,
  schema: ZodSchema<T> | null,
  options: { method?: HttpMethod; body?: object | string | null; retries?: number } = {}
): Promise<T> {
  const { method = "GET", body, retries = 2 } = options;
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      const accessToken = getAccessToken();
      const headers = {
        ...defaultHeaders,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      };

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers,
        body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
      });

      if (res.status === 401) {
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) {
          const retryHeaders = {
            ...headers,
            Authorization: `Bearer ${refreshedToken}`,
          };
          const retryRes = await fetch(url, {
            method,
            credentials: "include",
            headers: retryHeaders,
            body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
          });
          if (!retryRes.ok) {
            const text = await retryRes.text();
            throw new ApiError(text || retryRes.statusText, retryRes.status, url);
          }
          if (retryRes.status === 204 || schema === null) {
            // @ts-expect-error allow void return
            return undefined;
          }
          const json = await retryRes.json();
          return schema ? schema.parse(json) : (json as T);
        }
      }

      if (!res.ok) {
        const text = await res.text();
        throw new ApiError(text || res.statusText, res.status, url);
      }

      if (res.status === 204 || schema === null) {
        // @ts-expect-error allow void return
        return undefined;
      }

      const json = await res.json();
      return schema ? schema.parse(json) : (json as T);
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && error.status === 401) {
        logAuthEvent({ type: "token_invalid", message: "인증 정보가 만료되었습니다." });
      }
      console.error(`[api] ${method} ${url} failed (attempt ${attempt + 1})`, error);
      if (attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      attempt += 1;
    }
  }

  const parsedError = lastError instanceof Error ? lastError : new Error("Unknown API error");
  toast.error(parsedError.message || "데이터를 불러오지 못했어요.");
  throw parsedError;
}

export function createApiClient(baseUrl: string): ApiClient {
  const normalizedBase = (baseUrl || "").replace(/\/$/, "");
  const withBase = (path: string) => `${normalizedBase}${path}`;

  const safeRequest = async <T>(path: string, schema: ZodSchema<T> | null, options?: Parameters<typeof request>[2]) =>
    request(withBase(path), schema, options);

  return {
    listRequests: () => safeRequest("/requests", z.array(RequestSchema)),
    createRequest: (input) => safeRequest("/requests", RequestSchema, { method: "POST", body: RequestInputSchema.parse(input) }),
    updateRequest: (id, input) =>
      safeRequest(`/requests/${encodeURIComponent(id)}`, RequestSchema, {
        method: "PATCH",
        body: RequestUpdateSchema.parse(input),
      }),
    deleteRequest: (id) => safeRequest(`/requests/${encodeURIComponent(id)}`, null, { method: "DELETE" }),

    listQuotes: (requestId) =>
      safeRequest(
        requestId ? `/requests/${encodeURIComponent(requestId)}/quotes` : "/quotes",
        z.array(QuoteSchema)
      ),
    createQuote: (input) => safeRequest("/quotes", QuoteSchema, { method: "POST", body: QuoteInputSchema.parse(input) }),

    listMessages: (threadId) =>
      safeRequest(threadId ? `/threads/${encodeURIComponent(threadId)}/messages` : "/messages", z.array(MessageSchema)),
    sendMessage: (input) =>
      safeRequest("/messages", MessageSchema, {
        method: "POST",
        body: MessageInputSchema.parse(input),
      }),

    listOrders: () => safeRequest("/orders", z.array(OrderSchema)),
    updateOrderStatus: (id, status) =>
      safeRequest(`/orders/${encodeURIComponent(id)}`, OrderSchema, {
        method: "PATCH",
        body: { status },
      }),

    listProfiles: () => safeRequest("/profiles", z.array(ProfileSchema)),
    getProfile: (id) => safeRequest(`/profiles/${encodeURIComponent(id)}`, ProfileSchema),
    upsertProfile: (profile) =>
      safeRequest("/profiles", ProfileSchema, {
        method: "PUT",
        body: ProfileInputSchema.parse(profile),
      }),

    getMeta: () => safeRequest("/meta", MetaSchema),
  };
}
