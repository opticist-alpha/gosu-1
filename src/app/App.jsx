import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import AuthStatus from "../features/auth/components/AuthStatus";
import SecurityBanner from "../features/auth/components/SecurityBanner";

const navItems = [
  { to: "/", label: "홈" },
  { to: "/pros", label: "고수 찾기" },
  { to: "/requests", label: "요청" },
  { to: "/messages", label: "메시지" },
  { to: "/orders", label: "주문" },
  { to: "/dashboard", label: "프로 대시보드" },
];

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold text-blue-600">
            Gosu
          </Link>
          <div className="flex items-center gap-6">
            <nav className="flex gap-3 text-sm font-medium text-slate-700">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive
                      ? "rounded px-3 py-1 bg-blue-50 text-blue-700"
                      : "rounded px-3 py-1 hover:bg-slate-100"
                  }
                  end={item.to === "/"}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <AuthStatus />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <SecurityBanner />
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-sm text-slate-500">
        숨고 스타일 매칭 데모 · React Router + Zustand
      </footer>
    </div>
  );
}
