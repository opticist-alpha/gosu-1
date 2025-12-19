import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../authStore";
import { authClient } from "../../services/authClient";
import { logAuthEvent } from "../../services/authEvents";

export default function RequireAuth({ roles = [], children }) {
  const location = useLocation();
  const { status, role } = useAuthStore();
  const [serverAllowed, setServerAllowed] = useState(null);

  const requiresRole = useMemo(() => roles.length > 0, [roles]);

  useEffect(() => {
    let isMounted = true;

    if (status === "authenticated" && requiresRole) {
      authClient
        .authorizeRole(roles)
        .then(() => {
          if (isMounted) setServerAllowed(true);
        })
        .catch((error) => {
          logAuthEvent({ type: "authorization_failed", message: error?.message || "권한 확인 실패" });
          if (isMounted) setServerAllowed(false);
        });
    } else if (status === "authenticated") {
      setServerAllowed(true);
    }

    return () => {
      isMounted = false;
    };
  }, [requiresRole, roles, status]);

  if (status === "idle" || status === "loading") {
    return <div className="rounded bg-white p-6 text-sm text-slate-500">인증 상태를 확인하고 있어요...</div>;
  }

  if (status !== "authenticated") {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requiresRole && role && !roles.includes(role)) {
    return (
      <div className="rounded border border-rose-100 bg-rose-50 p-6 text-sm text-rose-700">
        이 페이지는 {roles.join("/")} 계정만 접근할 수 있어요.
      </div>
    );
  }

  if (requiresRole && serverAllowed === false) {
    return (
      <div className="rounded border border-rose-100 bg-rose-50 p-6 text-sm text-rose-700">
        서버에서 권한을 확인할 수 없습니다. 다시 로그인해 주세요.
      </div>
    );
  }

  if (requiresRole && serverAllowed === null) {
    return <div className="rounded bg-white p-6 text-sm text-slate-500">권한을 확인하는 중입니다...</div>;
  }

  return children;
}
