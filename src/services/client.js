import { createApiClient } from "./api";
import { createMockApiClient } from "./mockApi";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
const shouldUseMock = import.meta.env.DEV && !import.meta.env.VITE_API_FORCE_SERVER;

export const apiClient = shouldUseMock ? createMockApiClient() : createApiClient(baseUrl);

export const apiSource = shouldUseMock ? "mock" : "server";
