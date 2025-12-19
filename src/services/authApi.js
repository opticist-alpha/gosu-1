const defaultHeaders = { "Content-Type": "application/json" };

async function requestJson(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const message = await res.text();
    const error = new Error(message || res.statusText);
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;
  return res.json();
}

export function createAuthClient(baseUrl) {
  const normalized = (baseUrl || "").replace(/\/$/, "");
  const withBase = (path) => `${normalized}${path}`;

  return {
    signIn: (payload) =>
      requestJson(withBase("/auth/login"), {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    signUp: (payload) =>
      requestJson(withBase("/auth/signup"), {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    refreshSession: () =>
      requestJson(withBase("/auth/refresh"), {
        method: "POST",
      }),
    getSession: () => requestJson(withBase("/auth/session")),
    signOut: () =>
      requestJson(withBase("/auth/logout"), {
        method: "POST",
      }),
    authorizeRole: (roles) =>
      requestJson(withBase("/auth/authorize"), {
        method: "POST",
        body: JSON.stringify({ roles }),
      }),
  };
}
