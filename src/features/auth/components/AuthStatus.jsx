import React from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../authStore";

export default function AuthStatus() {
  const { status, user, role, signOut } = useAuthStore();

  if (status === "authenticated" && user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
          {user.name} · {role === "pro" ? "프로" : "고객"}
        </span>
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-50"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <Link
      to="/auth"
      className="rounded border border-blue-200 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50"
    >
      로그인
    </Link>
  );
}
