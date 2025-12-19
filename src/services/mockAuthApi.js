import { sleep, uid } from "../shared/lib/utils";
import { formatDateTime } from "../shared/lib/format";

const SESSION_TTL_MS = 1000 * 60 * 15;

const seedUsers = [
  {
    id: "user_customer_demo",
    name: "데모 고객",
    email: "customer@gosu.test",
    role: "customer",
    password: "demo1234",
  },
  {
    id: "user_pro_demo",
    name: "프로 유나",
    email: "pro@gosu.test",
    role: "pro",
    password: "demo1234",
  },
];

export function createMockAuthClient(latency = 120) {
  let users = [...seedUsers];
  let session = null;

  const buildTokens = () => ({
    accessToken: `mock.${uid("access")}`,
    idToken: `mock.${uid("id")}`,
    expiresIn: Math.floor(SESSION_TTL_MS / 1000),
  });

  const ensureSession = () => {
    if (!session || Date.now() > session.expiresAt) {
      session = null;
      const error = new Error("세션이 만료되었습니다.");
      error.status = 401;
      throw error;
    }
    return session;
  };

  return {
    signIn: async ({ email, password }) => {
      await sleep(latency);
      const user = users.find((entry) => entry.email === email && entry.password === password);
      if (!user) {
        const error = new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
        error.status = 401;
        throw error;
      }
      const tokens = buildTokens();
      session = {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        tokens,
        issuedAt: formatDateTime(),
        expiresAt: Date.now() + SESSION_TTL_MS,
      };
      return { user: session.user, ...tokens };
    },
    signUp: async ({ name, email, password, role }) => {
      await sleep(latency);
      if (users.some((entry) => entry.email === email)) {
        const error = new Error("이미 등록된 이메일입니다.");
        error.status = 409;
        throw error;
      }
      const user = { id: uid("user"), name, email, role, password };
      users = [...users, user];
      const tokens = buildTokens();
      session = {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        tokens,
        issuedAt: formatDateTime(),
        expiresAt: Date.now() + SESSION_TTL_MS,
      };
      return { user: session.user, ...tokens };
    },
    refreshSession: async () => {
      await sleep(latency / 2);
      const existing = ensureSession();
      const tokens = buildTokens();
      session = {
        ...existing,
        tokens,
        issuedAt: formatDateTime(),
        expiresAt: Date.now() + SESSION_TTL_MS,
      };
      return { user: session.user, ...tokens };
    },
    getSession: async () => {
      await sleep(latency / 2);
      const existing = ensureSession();
      return { user: existing.user, ...existing.tokens };
    },
    signOut: async () => {
      await sleep(latency / 2);
      session = null;
      return { ok: true };
    },
    authorizeRole: async (roles) => {
      await sleep(latency / 3);
      const existing = ensureSession();
      const allowed = roles?.length ? roles.includes(existing.user.role) : true;
      if (!allowed) {
        const error = new Error("권한이 없습니다.");
        error.status = 403;
        throw error;
      }
      return { allowed };
    },
  };
}
