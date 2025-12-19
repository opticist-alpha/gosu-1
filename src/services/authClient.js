import { createAuthClient } from "./authApi";
import { createMockAuthClient } from "./mockAuthApi";
import { apiSource } from "./client";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

export const authClient = apiSource === "mock" ? createMockAuthClient() : createAuthClient(baseUrl);
