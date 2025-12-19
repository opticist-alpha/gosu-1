import { create } from "zustand";
import { authClient } from "../../services/authClient";
import { clearAccessToken, setAccessToken } from "../../services/authSession";
import { logAuthEvent } from "../../services/authEvents";

const REFRESH_SAFETY_MS = 30_000;
let refreshTimer = null;

function scheduleRefresh(expiresIn, refreshFn) {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  if (!expiresIn) return;
  const refreshIn = Math.max(expiresIn * 1000 - REFRESH_SAFETY_MS, 5_000);
  refreshTimer = setTimeout(() => {
    refreshFn();
  }, refreshIn);
}

function applySession(set, session) {
  if (!session) return;
  setAccessToken(session.accessToken);
  set({
    status: "authenticated",
    user: session.user,
    role: session.user?.role || null,
    accessToken: session.accessToken,
    idToken: session.idToken || null,
    sessionExpiresIn: session.expiresIn || null,
    error: null,
  });
}

function resetSession(set) {
  clearAccessToken();
  set({
    status: "guest",
    user: null,
    role: null,
    accessToken: null,
    idToken: null,
    sessionExpiresIn: null,
  });
}

export const useAuthStore = create((set, get) => ({
  status: "idle",
  user: null,
  role: null,
  accessToken: null,
  idToken: null,
  sessionExpiresIn: null,
  error: null,
  initializing: false,

  initialize: async () => {
    if (get().initializing) return;
    set({ initializing: true });
    try {
      const session = await authClient.getSession();
      applySession(set, session);
      scheduleRefresh(session?.expiresIn, () => get().refreshSession("scheduled"));
    } catch (error) {
      if (error?.status && error.status !== 401) {
        logAuthEvent({ type: "session_check_failed", message: error.message || "세션 확인 실패" });
      }
      resetSession(set);
    } finally {
      set({ initializing: false });
    }
  },

  signIn: async (payload) => {
    set({ status: "loading", error: null });
    try {
      const session = await authClient.signIn(payload);
      applySession(set, session);
      scheduleRefresh(session?.expiresIn, () => get().refreshSession("scheduled"));
      return session.user;
    } catch (error) {
      set({ status: "guest", error: error?.message || "로그인에 실패했습니다." });
      logAuthEvent({ type: "login_failed", message: error?.message || "로그인 실패" });
      throw error;
    }
  },

  signUp: async (payload) => {
    set({ status: "loading", error: null });
    try {
      const session = await authClient.signUp(payload);
      applySession(set, session);
      scheduleRefresh(session?.expiresIn, () => get().refreshSession("scheduled"));
      return session.user;
    } catch (error) {
      set({ status: "guest", error: error?.message || "회원가입에 실패했습니다." });
      logAuthEvent({ type: "signup_failed", message: error?.message || "회원가입 실패" });
      throw error;
    }
  },

  refreshSession: async (reason = "manual") => {
    try {
      const session = await authClient.refreshSession();
      applySession(set, session);
      scheduleRefresh(session?.expiresIn, () => get().refreshSession("scheduled"));
      return session;
    } catch (error) {
      resetSession(set);
      logAuthEvent({
        type: "token_refresh_failed",
        message: reason === "scheduled" ? "세션 갱신에 실패했습니다." : error?.message || "토큰 갱신 실패",
      });
      return null;
    }
  },

  signOut: async () => {
    set({ status: "loading", error: null });
    try {
      await authClient.signOut();
    } catch (error) {
      logAuthEvent({ type: "logout_failed", message: error?.message || "로그아웃 실패" });
    } finally {
      resetSession(set);
    }
  },

  forceSignOut: (message) => {
    resetSession(set);
    logAuthEvent({ type: "session_expired", message: message || "세션이 만료되었습니다." });
  },
}));
