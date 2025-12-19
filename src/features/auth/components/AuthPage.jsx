import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../authStore";

const roleOptions = [
  { value: "customer", label: "고객" },
  { value: "pro", label: "프로" },
];

export default function AuthPage() {
  const [mode, setMode] = useState("signin");
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });
  const { status, error, signIn, signUp } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isLoading = status === "loading";

  const redirectTo = useMemo(() => location.state?.from?.pathname || "/", [location.state]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (mode === "signin") {
        await signIn({ email: formState.email, password: formState.password });
      } else {
        await signUp({
          name: formState.name,
          email: formState.email,
          password: formState.password,
          role: formState.role,
        });
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      // handled in store
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800">{mode === "signin" ? "로그인" : "회원가입"}</h1>
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            {mode === "signin" ? "처음이신가요? 회원가입" : "이미 계정이 있나요? 로그인"}
          </button>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          OIDC/JWT 세션은 서버에서 httpOnly 쿠키로 관리되며, 브라우저에는 액세스 토큰만 메모리로 저장합니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="name">
                이름
              </label>
              <input
                id="name"
                name="name"
                value={formState.name}
                onChange={handleChange}
                className="mt-2 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                placeholder="이름을 입력해 주세요"
                required
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formState.email}
              onChange={handleChange}
              className="mt-2 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formState.password}
              onChange={handleChange}
              className="mt-2 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              placeholder="비밀번호를 입력해 주세요"
              required
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="role">
                역할
              </label>
              <select
                id="role"
                name="role"
                value={formState.role}
                onChange={handleChange}
                className="mt-2 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="rounded border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isLoading ? "처리 중..." : mode === "signin" ? "로그인" : "회원가입"}
          </button>
        </form>
      </div>

      <div className="mt-4 rounded border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
        <p className="font-semibold text-slate-700">데모 계정</p>
        <ul className="mt-1 space-y-1">
          <li>고객: customer@gosu.test / demo1234</li>
          <li>프로: pro@gosu.test / demo1234</li>
        </ul>
      </div>
    </div>
  );
}
