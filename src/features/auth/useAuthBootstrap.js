import { useEffect } from "react";
import { useAuthStore } from "./authStore";

export function useAuthBootstrap() {
  const initialize = useAuthStore((state) => state.initialize);
  const forceSignOut = useAuthStore((state) => state.forceSignOut);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const handler = (event) => {
      forceSignOut(event?.detail?.message);
    };
    window.addEventListener("auth:force-signout", handler);
    return () => window.removeEventListener("auth:force-signout", handler);
  }, [forceSignOut]);
}
