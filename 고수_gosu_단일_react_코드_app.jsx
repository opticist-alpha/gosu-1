import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * 고수(Gosu) — 숨고 스타일 서비스 매칭 단일 파일 데모
 * - 고객: 서비스 요청(견적 요청) → 고수 추천 → 메시지/예약
 * - 고수: 프로필/견적 응답 → 메시지/주문 관리
 *
 * 실행 가정:
 * - Vite + React 환경
 * - Tailwind CSS가 설정되어 있으면 더 예쁘게 보입니다(필수 아님).
 *
 * 사용법:
 * - 이 파일을 src/App.jsx 로 저장하고 <App />를 렌더링하세요.
 */

// -----------------------------
// Utils
// -----------------------------

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function formatKRW(value) {
  if (value == null || Number.isNaN(Number(value))) return "-";
  const v = Math.round(Number(value));
  return v.toLocaleString("ko-KR") + "원";
}

function formatDateTime(ts) {
  const d = ts ? new Date(ts) : new Date();
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function cx(...args) {
  return args
    .flatMap((a) => {
      if (!a) return [];
      if (typeof a === "string") return [a];
      if (Array.isArray(a)) return a.filter(Boolean);
      if (typeof a === "object") return Object.entries(a).filter(([, v]) => Boolean(v)).map(([k]) => k);
      return [];
    })
    .join(" ");
}

function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return typeof initialValue === "function" ? initialValue() : initialValue;
      return JSON.parse(raw);
    } catch {
      return typeof initialValue === "function" ? initialValue() : initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [key, state]);

  return [state, setState];
}

function useEventListener(target, type, handler, options) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const el = target?.current || target || window;
    if (!el?.addEventListener) return;
    const h = (e) => handlerRef.current(e);
    el.addEventListener(type, h, options);
    return () => el.removeEventListener(type, h, options);
  }, [target, type, options]);
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [query]);

  return matches;
}

function safeText(s, max = 240) {
  const t = String(s ?? "").trim();
  if (!t) return "";
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

function scoreMatch({ pro, categoryId, query, region }) {
  let score = 0;
  const q = String(query ?? "").trim().toLowerCase();
  const r = String(region ?? "").trim().toLowerCase();

  if (categoryId && pro.categories.includes(categoryId)) score += 40;
  if (q) {
    const hay = `${pro.name} ${pro.title} ${pro.bio} ${(pro.tags || []).join(" ")}`.toLowerCase();
    if (hay.includes(q)) score += 25;
  }
  if (r) {
    if ((pro.region || "").toLowerCase().includes(r)) score += 20;
  }

  // Signals
  score += clamp(pro.rating * 8, 0, 40);
  score += clamp(Math.log10((pro.reviewCount || 0) + 1) * 10, 0, 20);
  score += pro.verified ? 6 : 0;
  score += pro.responseRate ? clamp(pro.responseRate * 0.1, 0, 10) : 0;
  return score;
}

// -----------------------------
// Mock data
// -----------------------------

const CATEGORIES = [
  { id: "move", name: "이사", icon: "🚚", hint: "원룸/투룸/가정 이사" },
  { id: "clean", name: "청소", icon: "🧼", hint: "입주/이사/사무실" },
  { id: "repair", name: "수리", icon: "🔧", hint: "가전/배관/도어" },
  { id: "interior", name: "인테리어", icon: "🪚", hint: "도배/장판/리모델링" },
  { id: "lesson", name: "레슨", icon: "🎸", hint: "영어/악기/과외" },
  { id: "photo", name: "촬영", icon: "📸", hint: "프로필/행사" },
  { id: "it", name: "개발·디자인", icon: "💻", hint: "웹/앱/브랜딩" },
  { id: "pet", name: "펫", icon: "🐾", hint: "산책/케어" },
];

const SAMPLE_PROS = [
  {
    id: "pro_neo_move",
    name: "네오",
    title: "원룸·가정 이사 전문",
    categories: ["move"],
    region: "서울/경기",
    tags: ["당일견적", "포장", "보험"],
    rating: 4.9,
    reviewCount: 312,
    verified: true,
    responseRate: 96,
    responseTimeMin: 18,
    minPrice: 90000,
    bio: "사진·영상으로 사전 견적, 현장 추가요금 최소화 약속드립니다.",
    highlights: ["추가요금 정책 공개", "파손 보상", "친절한 팀 운영"],
  },
  {
    id: "pro_yuna_clean",
    name: "유나클린",
    title: "입주·이사 청소",
    categories: ["clean"],
    region: "서울",
    tags: ["친환경", "스팀", "하자체크"],
    rating: 4.8,
    reviewCount: 221,
    verified: true,
    responseRate: 92,
    responseTimeMin: 25,
    minPrice: 120000,
    bio: "작업 전/후 사진 제공, 재방문 A/S 기준을 명확히 안내합니다.",
    highlights: ["현장 체크리스트", "A/S 기준 안내", "소독/스팀"],
  },
  {
    id: "pro_minsu_repair",
    name: "민수",
    title: "배관·도어·가전 수리",
    categories: ["repair"],
    region: "경기",
    tags: ["즉시출동", "정찰제", "야간"],
    rating: 4.7,
    reviewCount: 144,
    verified: false,
    responseRate: 88,
    responseTimeMin: 35,
    minPrice: 35000,
    bio: "증상 진단 후, 가능한 수리/교체 옵션을 투명하게 설명드립니다.",
    highlights: ["부품 가격 공개", "안전 점검", "야간 대응"],
  },
  {
    id: "pro_haru_it",
    name: "하루스튜디오",
    title: "웹·앱·브랜딩 디자인",
    categories: ["it"],
    region: "전국(원격)",
    tags: ["Figma", "React", "브랜딩"],
    rating: 4.9,
    reviewCount: 98,
    verified: true,
    responseRate: 97,
    responseTimeMin: 12,
    minPrice: 300000,
    bio: "목표 KPI 기반의 화면 구조와, 개발 친화적 디자인 시스템을 제공합니다.",
    highlights: ["디자인 시스템", "성능·접근성", "런칭 지원"],
  },
  {
    id: "pro_arin_photo",
    name: "아린",
    title: "프로필·행사 촬영",
    categories: ["photo"],
    region: "서울/인천",
    tags: ["보정", "스냅", "리터칭"],
    rating: 4.6,
    reviewCount: 74,
    verified: false,
    responseRate: 85,
    responseTimeMin: 50,
    minPrice: 180000,
    bio: "촬영 목적에 맞춰 톤앤매너를 먼저 합의하고, 보정 가이드도 공유합니다.",
    highlights: ["톤앤매너 합의", "보정 가이드", "파일 전달"],
  },
  {
    id: "pro_seojun_lesson",
    name: "서준",
    title: "영어 회화/시험",
    categories: ["lesson"],
    region: "서울/온라인",
    tags: ["레벨테스트", "커리큘럼", "피드백"],
    rating: 4.8,
    reviewCount: 164,
    verified: true,
    responseRate: 90,
    responseTimeMin: 40,
    minPrice: 45000,
    bio: "목표와 현재 실력 간 갭을 진단하고, 주간 루틴을 함께 설계합니다.",
    highlights: ["레벨 진단", "주간 루틴", "피드백"],
  },
  {
    id: "pro_dal_pet",
    name: "달",
    title: "펫 산책/케어",
    categories: ["pet"],
    region: "부산",
    tags: ["대형견", "산책", "돌봄일지"],
    rating: 4.7,
    reviewCount: 52,
    verified: true,
    responseRate: 91,
    responseTimeMin: 28,
    minPrice: 20000,
    bio: "강아지 성향에 맞춰 산책 루트를 조정하고, 사진과 함께 일지를 공유합니다.",
    highlights: ["돌봄일지", "안전장비", "성향맞춤"],
  },
  {
    id: "pro_jia_interior",
    name: "지아",
    title: "도배/장판/부분 인테리어",
    categories: ["interior"],
    region: "대전/세종",
    tags: ["샘플", "견적서", "하자보수"],
    rating: 4.6,
    reviewCount: 88,
    verified: false,
    responseRate: 87,
    responseTimeMin: 45,
    minPrice: 250000,
    bio: "시공 전 자재 샘플과 범위를 명확히 합의하고, 하자보수 기준을 안내합니다.",
    highlights: ["자재 샘플", "범위 합의", "하자보수"],
  },
];

// -----------------------------
// “DB” in localStorage
// -----------------------------

const DB_KEY = "gosu_demo_db_v1";

function makeInitialDB() {
  const now = Date.now();
  return {
    version: 1,
    users: [
      {
        id: "u_demo_customer",
        role: "customer",
        name: "데모 고객",
        phone: "010-0000-0000",
        region: "서울",
        createdAt: now - 1000 * 60 * 60 * 24 * 20,
      },
      {
        id: "u_demo_pro",
        role: "pro",
        name: "데모 고수",
        phone: "010-1111-2222",
        region: "서울/경기",
        proId: "pro_haru_it",
        createdAt: now - 1000 * 60 * 60 * 24 * 60,
      },
    ],
    pros: SAMPLE_PROS,
    requests: [
      {
        id: "req_seed_1",
        customerId: "u_demo_customer",
        categoryId: "clean",
        title: "투룸 이사청소",
        detail: "평수 18평 / 베란다 1 / 곰팡이 약간. 견적 부탁드립니다.",
        region: "서울",
        schedule: { type: "date", value: now + 1000 * 60 * 60 * 24 * 7 },
        budgetMin: 120000,
        budgetMax: 200000,
        status: "open", // open | quoted | booked | done | cancelled
        createdAt: now - 1000 * 60 * 60 * 5,
        invitedProIds: ["pro_yuna_clean"],
        quotes: [
          {
            id: "q_seed_1",
            proId: "pro_yuna_clean",
            price: 165000,
            message: "현장 사진 2~3장 주시면 더 정확히 안내드릴게요. 스팀 포함입니다.",
            createdAt: now - 1000 * 60 * 30,
          },
        ],
      },
    ],
    threads: [
      {
        id: "th_seed_1",
        requestId: "req_seed_1",
        customerId: "u_demo_customer",
        proId: "pro_yuna_clean",
        messages: [
          {
            id: "m1",
            sender: "pro",
            text: "안녕하세요! 투룸 이사청소 문의주셔서 감사합니다. 평면도/사진 있으실까요?",
            createdAt: now - 1000 * 60 * 22,
          },
          {
            id: "m2",
            sender: "customer",
            text: "사진 곧 보내드릴게요! 베란다 곰팡이 조금 있어요.",
            createdAt: now - 1000 * 60 * 20,
          },
        ],
        createdAt: now - 1000 * 60 * 25,
        updatedAt: now - 1000 * 60 * 20,
      },
    ],
    orders: [],
    reviews: [],
    audit: [
      {
        id: "a1",
        type: "seed",
        message: "초기 데이터 생성",
        createdAt: now,
      },
    ],
  };
}

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return makeInitialDB();
    const parsed = JSON.parse(raw);
    if (!parsed?.version) return makeInitialDB();
    return parsed;
  } catch {
    return makeInitialDB();
  }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function addAudit(db, message, type = "info") {
  db.audit = db.audit || [];
  db.audit.unshift({ id: uid("audit"), type, message: safeText(message, 500), createdAt: Date.now() });
}

// -----------------------------
// UI Primitives
// -----------------------------

function Icon({ name, className }) {
  // Minimal inline icon set
  const common = "inline-block align-[-2px]";
  const c = cx(common, className);
  const icons = {
    search: (
      <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-5.2-5.2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    chevron: (
      <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    x: (
      <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    spark: (
      <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2l1.2 5.2L18 9l-4.8 1.8L12 16l-1.2-5.2L6 9l4.8-1.8L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
    chat: (
      <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 4h16v12H7l-3 3V4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
    shield: (
      <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2 20 6v6c0 5-3.5 9.4-8 10-4.5-.6-8-5-8-10V6l8-4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M9 12l2 2 4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    calendar: (
      <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M7 2v3M17 2v3M3 9h18M5 6h14a2 2 0 0 1 2 2v13H3V8a2 2 0 0 1 2-2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    user: (
      <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20 21a8 8 0 1 0-16 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
    list: (
      <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 6h13M8 12h13M8 18h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M3.5 6h.5M3.5 12h.5M3.5 18h.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    bolt: (
      <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M13 2 3 14h8l-1 8 11-14h-8l0-6Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };
  return icons[name] || null;
}

function Button({ variant = "primary", size = "md", className, disabled, ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const variants = {
    primary:
      "bg-black text-white hover:bg-neutral-800 focus-visible:ring-black disabled:bg-neutral-300 disabled:text-neutral-600",
    secondary:
      "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus-visible:ring-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400",
    ghost:
      "bg-transparent text-neutral-900 hover:bg-neutral-100 focus-visible:ring-neutral-400 disabled:text-neutral-400",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 disabled:bg-red-200 disabled:text-red-500",
  };
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };
  return (
    <button
      className={cx(base, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    />
  );
}

function Badge({ tone = "neutral", className, children }) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-800",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    info: "bg-sky-50 text-sky-700",
  };
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

function Input({ label, hint, error, className, ...props }) {
  return (
    <label className={cx("block", className)}>
      {label ? <div className="mb-1 text-sm font-semibold text-neutral-900">{label}</div> : null}
      <input
        className={cx(
          "w-full rounded-xl border px-3 py-2 text-sm outline-none transition",
          error ? "border-red-400 focus:border-red-500" : "border-neutral-200 focus:border-neutral-400",
          "bg-white"
        )}
        {...props}
      />
      {error ? <div className="mt-1 text-xs font-semibold text-red-600">{error}</div> : null}
      {!error && hint ? <div className="mt-1 text-xs text-neutral-500">{hint}</div> : null}
    </label>
  );
}

function Textarea({ label, hint, error, className, rows = 4, ...props }) {
  return (
    <label className={cx("block", className)}>
      {label ? <div className="mb-1 text-sm font-semibold text-neutral-900">{label}</div> : null}
      <textarea
        rows={rows}
        className={cx(
          "w-full resize-y rounded-xl border px-3 py-2 text-sm outline-none transition",
          error ? "border-red-400 focus:border-red-500" : "border-neutral-200 focus:border-neutral-400",
          "bg-white"
        )}
        {...props}
      />
      {error ? <div className="mt-1 text-xs font-semibold text-red-600">{error}</div> : null}
      {!error && hint ? <div className="mt-1 text-xs text-neutral-500">{hint}</div> : null}
    </label>
  );
}

function Select({ label, hint, error, className, children, ...props }) {
  return (
    <label className={cx("block", className)}>
      {label ? <div className="mb-1 text-sm font-semibold text-neutral-900">{label}</div> : null}
      <select
        className={cx(
          "w-full rounded-xl border px-3 py-2 text-sm outline-none transition",
          error ? "border-red-400 focus:border-red-500" : "border-neutral-200 focus:border-neutral-400",
          "bg-white"
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <div className="mt-1 text-xs font-semibold text-red-600">{error}</div> : null}
      {!error && hint ? <div className="mt-1 text-xs text-neutral-500">{hint}</div> : null}
    </label>
  );
}

function Divider({ className }) {
  return <div className={cx("h-px w-full bg-neutral-200", className)} />;
}

function Card({ className, children }) {
  return <div className={cx("rounded-2xl border border-neutral-200 bg-white shadow-sm", className)}>{children}</div>;
}

function CardHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5">
      <div className="min-w-0">
        <div className="truncate text-base font-extrabold text-neutral-900">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-neutral-600">{subtitle}</div> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function CardBody({ className, children }) {
  return <div className={cx("px-5 pb-5", className)}>{children}</div>;
}

function Modal({ open, title, description, onClose, children, footer }) {
  useEventListener(
    window,
    "keydown",
    (e) => {
      if (!open) return;
      if (e.key === "Escape") onClose?.();
    },
    { passive: true }
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0">
            <div className="truncate text-base font-extrabold text-neutral-900">{title}</div>
            {description ? <div className="mt-1 text-sm text-neutral-600">{description}</div> : null}
          </div>
          <Button variant="ghost" className="-mr-2" onClick={onClose} aria-label="닫기">
            <Icon name="x" className="h-5 w-5" />
          </Button>
        </div>
        <div className="max-h-[70vh] overflow-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t bg-neutral-50 px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

function ToastHost({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            "rounded-2xl border bg-white p-4 shadow-lg",
            t.tone === "good" && "border-emerald-200",
            t.tone === "warn" && "border-amber-200",
            t.tone === "bad" && "border-red-200"
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-neutral-900">{t.title}</div>
              {t.message ? <div className="mt-1 text-sm text-neutral-600">{t.message}</div> : null}
            </div>
            <button
              className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100"
              onClick={() => onRemove(t.id)}
              aria-label="알림 닫기"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = (toast) => {
    const id = uid("toast");
    const t = { id, tone: "good", title: "알림", message: "", ...toast };
    setToasts((prev) => [t, ...prev].slice(0, 5));
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3800);
  };
  const remove = (id) => setToasts((prev) => prev.filter((x) => x.id !== id));
  return { toasts, push, remove };
}

// -----------------------------
// App
// -----------------------------

const ROUTES = {
  HOME: "home",
  FIND: "find",
  REQUEST: "request",
  MESSAGES: "messages",
  ORDERS: "orders",
  ACCOUNT: "account",
  PRO: "pro",
};

function App() {
  const [db, setDB] = useLocalStorageState(DB_KEY, () => loadDB());
  const [session, setSession] = useLocalStorageState("gosu_demo_session_v1", () => ({ userId: "u_demo_customer" }));
  const [route, setRoute] = useState({ name: ROUTES.HOME, params: {} });
  const { toasts, push, remove } = useToasts();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Persist DB updates
  useEffect(() => {
    saveDB(db);
  }, [db]);

  const me = useMemo(() => db.users.find((u) => u.id === session.userId) || null, [db.users, session.userId]);

  const activePro = useMemo(() => {
    if (!me) return null;
    if (me.role === "pro") return db.pros.find((p) => p.id === me.proId) || null;
    return null;
  }, [db.pros, me]);

  const navItems = useMemo(() => {
    const base = [
      { key: ROUTES.HOME, label: "홈" },
      { key: ROUTES.FIND, label: "고수 찾기" },
      { key: ROUTES.REQUEST, label: "견적 요청" },
      { key: ROUTES.MESSAGES, label: "메시지" },
      { key: ROUTES.ORDERS, label: "주문" },
    ];
    const pro = { key: ROUTES.PRO, label: "고수 대시보드" };
    const account = { key: ROUTES.ACCOUNT, label: "계정" };
    return me?.role === "pro" ? [...base.slice(0, 5), pro, account] : [...base, account];
  }, [me?.role]);

  const api = useMemo(() => {
    const updateDB = (updater) => {
      setDB((prev) => {
        const next = typeof updater === "function" ? updater(structuredClone(prev)) : structuredClone(updater);
        return next;
      });
    };

    const ensureThread = (requestId, proId) => {
      let th = db.threads.find((t) => t.requestId === requestId && t.proId === proId);
      if (th) return th;
      const req = db.requests.find((r) => r.id === requestId);
      if (!req) return null;
      th = {
        id: uid("th"),
        requestId,
        customerId: req.customerId,
        proId,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      updateDB((d) => {
        d.threads.unshift(th);
        addAudit(d, `스레드 생성: ${requestId} - ${proId}`);
        return d;
      });
      return th;
    };

    return {
      me,
      activePro,
      isDesktop,
      db,
      setRoute,
      setSession,
      pushToast: push,
      // actions
      signIn({ role, name, phone, region, proId }) {
        const id = uid("u");
        updateDB((d) => {
          d.users.unshift({
            id,
            role,
            name: safeText(name, 40) || (role === "pro" ? "새 고수" : "새 고객"),
            phone: safeText(phone, 30),
            region: safeText(region, 30),
            proId: role === "pro" ? proId : undefined,
            createdAt: Date.now(),
          });
          addAudit(d, `회원 생성(${role}): ${name}`);
          return d;
        });
        setSession({ userId: id });
        push({ tone: "good", title: "로그인 완료", message: `${role === "pro" ? "고수" : "고객"} 계정으로 시작합니다.` });
        setRoute({ name: ROUTES.HOME, params: {} });
      },
      signOut() {
        setSession({ userId: "u_demo_customer" });
        push({ tone: "warn", title: "로그아웃", message: "데모 고객 계정으로 전환되었습니다." });
      },
      createRequest(payload) {
        const id = uid("req");
        const now = Date.now();
        const req = {
          id,
          customerId: me?.id,
          status: "open",
          createdAt: now,
          quotes: [],
          invitedProIds: payload.invitedProIds || [],
          ...payload,
        };
        updateDB((d) => {
          d.requests.unshift(req);
          addAudit(d, `견적 요청 생성: ${req.title || req.categoryId}`);
          return d;
        });
        push({ tone: "good", title: "요청 등록 완료", message: "고수에게 견적 요청을 보냈습니다." });
        return id;
      },
      submitQuote({ requestId, proId, price, message }) {
        updateDB((d) => {
          const req = d.requests.find((r) => r.id === requestId);
          if (!req) return d;
          req.quotes = req.quotes || [];
          req.invitedProIds = Array.from(new Set([...(req.invitedProIds || []), proId]));
          req.quotes.unshift({ id: uid("q"), proId, price: Number(price), message: safeText(message, 600), createdAt: Date.now() });
          req.status = "quoted";
          addAudit(d, `견적 등록: ${requestId} by ${proId}`);
          return d;
        });
        ensureThread(requestId, proId);
        push({ tone: "good", title: "견적 전송", message: "고객에게 견적을 전송했습니다." });
      },
      async sendMessage({ threadId, sender, text }) {
        const trimmed = safeText(text, 800);
        if (!trimmed) return;
        updateDB((d) => {
          const th = d.threads.find((t) => t.id === threadId);
          if (!th) return d;
          th.messages.push({ id: uid("m"), sender, text: trimmed, createdAt: Date.now() });
          th.updatedAt = Date.now();
          addAudit(d, `메시지: ${threadId} (${sender})`);
          return d;
        });

        // tiny “smart reply” for demo when customer sends
        if (sender === "customer") {
          await sleep(450);
          updateDB((d) => {
            const th = d.threads.find((t) => t.id === threadId);
            if (!th) return d;
            const pro = d.pros.find((p) => p.id === th.proId);
            const replies = [
              "네, 가능합니다! 일정/주소 알려주시면 더 정확히 안내드릴게요.",
              "추가로 사진 2~3장 주시면 견적 범위를 더 정확히 잡을 수 있어요.",
              "요청 내용 확인했습니다. 빠르게 견적 드리겠습니다.",
            ];
            const text = `${pro?.name || "고수"}: ${replies[Math.floor(Math.random() * replies.length)]}`;
            th.messages.push({ id: uid("m"), sender: "pro", text, createdAt: Date.now() });
            th.updatedAt = Date.now();
            addAudit(d, `자동응답: ${threadId}`, "info");
            return d;
          });
        }
      },
      bookOrder({ requestId, quoteId }) {
        const now = Date.now();
        updateDB((d) => {
          const req = d.requests.find((r) => r.id === requestId);
          if (!req) return d;
          const quote = (req.quotes || []).find((q) => q.id === quoteId);
          if (!quote) return d;
          const order = {
            id: uid("ord"),
            requestId,
            customerId: req.customerId,
            proId: quote.proId,
            quoteId,
            price: quote.price,
            status: "booked", // booked | in_progress | done | cancelled
            createdAt: now,
            updatedAt: now,
          };
          d.orders.unshift(order);
          req.status = "booked";
          addAudit(d, `주문 생성: ${requestId} → ${quote.proId}`);
          return d;
        });
        push({ tone: "good", title: "예약 완료", message: "주문이 생성되었습니다. 메시지로 세부사항을 조율하세요." });
      },
      updateOrderStatus(orderId, status) {
        updateDB((d) => {
          const ord = d.orders.find((o) => o.id === orderId);
          if (!ord) return d;
          ord.status = status;
          ord.updatedAt = Date.now();
          const req = d.requests.find((r) => r.id === ord.requestId);
          if (req) {
            if (status === "done") req.status = "done";
            if (status === "cancelled") req.status = "cancelled";
          }
          addAudit(d, `주문 상태 변경: ${orderId} → ${status}`);
          return d;
        });
        push({ tone: "good", title: "상태 변경", message: "주문 상태가 업데이트되었습니다." });
      },
      resetDB() {
        const fresh = makeInitialDB();
        setDB(fresh);
        setSession({ userId: "u_demo_customer" });
        setRoute({ name: ROUTES.HOME, params: {} });
        push({ tone: "warn", title: "초기화", message: "데모 데이터로 초기화되었습니다." });
      },
      ensureThread,
    };
  }, [db, me?.id, me?.role, activePro, isDesktop, push, setDB, setRoute, setSession]);

  // route guard
  useEffect(() => {
    if (!me) {
      setRoute({ name: ROUTES.HOME, params: {} });
    }
  }, [me]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <TopBar api={api} route={route} navItems={navItems} />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6">
        <RouteView api={api} route={route} />
      </main>

      <Footer api={api} />
      <ToastHost toasts={toasts} onRemove={remove} />
    </div>
  );
}

// -----------------------------
// TopBar + Navigation
// -----------------------------

function TopBar({ api, route, navItems }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");

  const go = (name, params = {}) => api.setRoute({ name, params });

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <button
          className="group flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-neutral-100"
          onClick={() => go(ROUTES.HOME)}
          aria-label="홈으로"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-black text-white">
            <Icon name="spark" className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-extrabold">고수</div>
            <div className="text-xs text-neutral-500">전문가 매칭</div>
          </div>
        </button>

        <div className="hidden flex-1 items-center gap-3 lg:flex">
          <div className="relative w-full max-w-xl">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <Icon name="search" className="h-5 w-5" />
            </div>
            <input
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              placeholder="예: 이사, 청소, 배관, 웹사이트…"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-neutral-400"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              api.setRoute({ name: ROUTES.FIND, params: { q: globalQuery } });
            }}
          >
            검색
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <Badge tone={api.me?.role === "pro" ? "info" : "good"}>
              {api.me?.role === "pro" ? "고수" : "고객"} · {api.me?.name}
            </Badge>
          </div>
          <Button variant="ghost" className="lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label="메뉴">
            <Icon name="list" className="h-5 w-5" />
          </Button>
          <Button variant="secondary" onClick={() => setAuthOpen(true)}>
            전환
          </Button>
        </div>
      </div>

      <div className="mx-auto hidden max-w-6xl px-4 pb-3 lg:block lg:px-6">
        <nav className="flex flex-wrap gap-2">
          {navItems.map((it) => {
            const active = route.name === it.key;
            return (
              <button
                key={it.key}
                onClick={() => go(it.key)}
                className={cx(
                  "rounded-full px-3 py-1.5 text-sm font-semibold transition",
                  active ? "bg-black text-white" : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
                )}
              >
                {it.label}
              </button>
            );
          })}
        </nav>
      </div>

      <MobileNavDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        navItems={navItems}
        activeKey={route.name}
        onNavigate={(key) => {
          go(key);
          setMobileNavOpen(false);
        }}
        api={api}
      />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} api={api} />
    </header>
  );
}

function MobileNavDrawer({ open, onClose, navItems, activeKey, onNavigate, api }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute right-0 top-0 h-full w-[min(360px,85vw)] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold">{api.me?.name}</div>
            <div className="text-xs text-neutral-600">{api.me?.role === "pro" ? "고수" : "고객"} · {api.me?.region}</div>
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="닫기">
            <Icon name="x" className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4">
          <div className="grid gap-2">
            {navItems.map((it) => {
              const active = activeKey === it.key;
              return (
                <button
                  key={it.key}
                  onClick={() => onNavigate(it.key)}
                  className={cx(
                    "flex items-center justify-between rounded-2xl border px-4 py-3 text-left",
                    active ? "border-black bg-black text-white" : "border-neutral-200 bg-white hover:bg-neutral-50"
                  )}
                >
                  <span className="text-sm font-extrabold">{it.label}</span>
                  <Icon name="chevron" className="h-5 w-5" />
                </button>
              );
            })}
          </div>

          <Divider className="my-4" />

          <Button variant="secondary" className="w-full" onClick={() => api.resetDB()}>
            데모 데이터 초기화
          </Button>
          <div className="mt-2 text-xs text-neutral-500">
            ※ 로컬스토리지 기반 데모입니다.
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// Auth Modal
// -----------------------------

function AuthModal({ open, onClose, api }) {
  const [tab, setTab] = useState("switch"); // switch | create

  useEffect(() => {
    if (open) setTab("switch");
  }, [open]);

  const customer = api.db.users.find((u) => u.id === "u_demo_customer");
  const pro = api.db.users.find((u) => u.id === "u_demo_pro");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="계정 전환"
      description="데모 고객/고수로 빠르게 전환하거나 새 계정을 만들어 테스트할 수 있습니다."
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-neutral-500">로컬스토리지에 저장됩니다.</div>
          <div className="flex gap-2">
            <Button variant={tab === "switch" ? "primary" : "secondary"} onClick={() => setTab("switch")}>전환</Button>
            <Button variant={tab === "create" ? "primary" : "secondary"} onClick={() => setTab("create")}>새 계정</Button>
          </div>
        </div>
      }
    >
      {tab === "switch" ? (
        <div className="grid gap-3">
          <Card>
            <CardHeader
              title={`데모 고객 · ${customer?.name}`}
              subtitle="요청 등록/견적 비교/예약 테스트"
              right={<Badge tone="good">customer</Badge>}
            />
            <CardBody>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-neutral-600">현재: {api.me?.id === customer?.id ? "사용 중" : "미사용"}</div>
                <Button
                  onClick={() => {
                    api.setSession({ userId: customer.id });
                    api.pushToast({ tone: "good", title: "전환 완료", message: "데모 고객으로 전환했습니다." });
                    onClose?.();
                  }}
                  disabled={api.me?.id === customer?.id}
                >
                  이 계정으로
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={`데모 고수 · ${pro?.name}`}
              subtitle="견적 응답/주문 관리 테스트"
              right={<Badge tone="info">pro</Badge>}
            />
            <CardBody>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-neutral-600">현재: {api.me?.id === pro?.id ? "사용 중" : "미사용"}</div>
                <Button
                  onClick={() => {
                    api.setSession({ userId: pro.id });
                    api.pushToast({ tone: "good", title: "전환 완료", message: "데모 고수로 전환했습니다." });
                    onClose?.();
                  }}
                  disabled={api.me?.id === pro?.id}
                >
                  이 계정으로
                </Button>
              </div>
            </CardBody>
          </Card>

          <div className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-700">
            <div className="font-extrabold">팁</div>
            <ul className="mt-2 list-disc pl-5 text-sm text-neutral-600">
              <li>"견적 요청"에서 새 요청을 등록해보세요.</li>
              <li>고수 계정으로 전환 후 "고수 대시보드"에서 견적을 보내보세요.</li>
              <li>"메시지"에서 고객↔고수 대화를 확인하세요.</li>
            </ul>
          </div>
        </div>
      ) : (
        <CreateAccountForm api={api} onDone={onClose} />
      )}
    </Modal>
  );
}

function CreateAccountForm({ api, onDone }) {
  const [role, setRole] = useState("customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("서울");
  const [proId, setProId] = useState(api.db.pros[0]?.id || "");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!String(name).trim()) e.name = "이름을 입력해주세요.";
    if (String(name).trim().length > 40) e.name = "이름이 너무 깁니다.";
    if (phone && !/^[0-9\-\s+()]{7,}$/.test(phone)) e.phone = "전화번호 형식을 확인해주세요.";
    if (!String(region).trim()) e.region = "지역을 입력해주세요.";
    if (role === "pro" && !proId) e.proId = "고수 프로필을 선택해주세요.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          className={cx(
            "rounded-full px-3 py-1.5 text-sm font-semibold",
            role === "customer" ? "bg-black text-white" : "bg-neutral-100 hover:bg-neutral-200"
          )}
          onClick={() => setRole("customer")}
          type="button"
        >
          고객
        </button>
        <button
          className={cx(
            "rounded-full px-3 py-1.5 text-sm font-semibold",
            role === "pro" ? "bg-black text-white" : "bg-neutral-100 hover:bg-neutral-200"
          )}
          onClick={() => setRole("pro")}
          type="button"
        >
          고수
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="이름" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <Input label="전화번호(선택)" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
      </div>

      <Input label="지역" value={region} onChange={(e) => setRegion(e.target.value)} error={errors.region} />

      {role === "pro" ? (
        <Select label="연결할 고수 프로필" value={proId} onChange={(e) => setProId(e.target.value)} error={errors.proId}>
          {api.db.pros.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.title}
            </option>
          ))}
        </Select>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Button variant="secondary" onClick={() => onDone?.()} type="button">
          취소
        </Button>
        <Button
          onClick={() => {
            if (!validate()) return;
            api.signIn({ role, name, phone, region, proId });
            onDone?.();
          }}
          type="button"
        >
          시작하기
        </Button>
      </div>
    </div>
  );
}

// -----------------------------
// Router
// -----------------------------

function RouteView({ api, route }) {
  switch (route.name) {
    case ROUTES.HOME:
      return <HomePage api={api} />;
    case ROUTES.FIND:
      return <FindProsPage api={api} q={route.params?.q} categoryId={route.params?.categoryId} />;
    case ROUTES.REQUEST:
      return <RequestWizardPage api={api} />;
    case ROUTES.MESSAGES:
      return <MessagesPage api={api} />;
    case ROUTES.ORDERS:
      return <OrdersPage api={api} />;
    case ROUTES.ACCOUNT:
      return <AccountPage api={api} />;
    case ROUTES.PRO:
      return <ProDashboardPage api={api} />;
    default:
      return <HomePage api={api} />;
  }
}

// -----------------------------
// Home
// -----------------------------

function HomePage({ api }) {
  const featured = useMemo(() => {
    const list = [...api.db.pros];
    list.sort((a, b) => (b.rating * 1000 + b.reviewCount) - (a.rating * 1000 + a.reviewCount));
    return list.slice(0, 4);
  }, [api.db.pros]);

  return (
    <div className="grid gap-6">
      <Hero api={api} />

      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold">어떤 서비스를 찾으시나요?</div>
            <div className="text-sm text-neutral-600">카테고리 선택 후, 바로 견적 요청도 가능합니다.</div>
          </div>
          <Button variant="secondary" onClick={() => api.setRoute({ name: ROUTES.FIND, params: {} })}>
            전체 보기
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => api.setRoute({ name: ROUTES.FIND, params: { categoryId: c.id } })}
              className="rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:shadow"
            >
              <div className="text-2xl">{c.icon}</div>
              <div className="mt-2 text-sm font-extrabold">{c.name}</div>
              <div className="mt-1 text-xs text-neutral-600">{c.hint}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-lg font-extrabold">추천 고수</div>
            <div className="text-sm text-neutral-600">평점·후기·응답지표를 바탕으로 정렬했습니다.</div>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {featured.map((p) => (
            <ProCard key={p.id} pro={p} api={api} />
          ))}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader title="견적 요청" subtitle="3분 내 요청 등록" right={<Icon name="bolt" className="h-5 w-5" />} />
          <CardBody>
            <p className="text-sm text-neutral-600">
              서비스 범위/일정/예산만 입력하면, 조건에 맞는 고수에게 자동으로 요청이 전송됩니다.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="투명한 정보" subtitle="후기·응답률 공개" right={<Icon name="shield" className="h-5 w-5" />} />
          <CardBody>
            <p className="text-sm text-neutral-600">
              평점/후기 수, 응답률, 평균 응답 시간을 한눈에 비교하고 선택할 수 있습니다.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="메시지로 조율" subtitle="요청 후 바로 대화" right={<Icon name="chat" className="h-5 w-5" />} />
          <CardBody>
            <p className="text-sm text-neutral-600">
              일정/세부범위를 메시지로 확인한 뒤 예약하세요. 기록이 남아 분쟁도 줄입니다.
            </p>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

function Hero({ api }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-neutral-100" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-neutral-100" />

      <div className="relative grid gap-6 lg:grid-cols-2">
        <div>
          <Badge tone="info" className="mb-3">
            데모 · 로컬스토리지 기반
          </Badge>
          <h1 className="text-2xl font-black leading-tight sm:text-3xl">
            필요한 서비스를 <span className="underline decoration-neutral-300">딱 맞는 고수</span>와 연결하세요.
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            "고수"는 서비스 요청 → 견적 비교 → 메시지 조율 → 예약까지 한 번에 제공하는 데모 앱입니다.
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => api.setRoute({ name: ROUTES.REQUEST, params: {} })}>견적 요청 시작</Button>
            <Button variant="secondary" onClick={() => api.setRoute({ name: ROUTES.FIND, params: {} })}>
              고수 먼저 둘러보기
            </Button>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <MiniStat label="응답률" value="90%+" />
            <MiniStat label="평균 응답" value="30분 내" />
            <MiniStat label="검증" value="리뷰/지표" />
          </div>
        </div>

        <div className="grid gap-3">
          <Card className="overflow-hidden">
            <div className="border-b bg-neutral-50 px-5 py-3">
              <div className="text-sm font-extrabold">빠른 예시</div>
              <div className="text-xs text-neutral-600">투룸 이사청소 견적 요청 → 견적 도착</div>
            </div>
            <div className="p-5">
              <div className="grid gap-3">
                <div className="rounded-2xl border border-neutral-200 p-3">
                  <div className="text-xs text-neutral-500">요청</div>
                  <div className="mt-1 text-sm font-extrabold">투룸 이사청소</div>
                  <div className="mt-1 text-sm text-neutral-600">18평 · 일정 1주일 후 · 예산 12~20만</div>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="text-xs text-emerald-700">견적 도착</div>
                  <div className="mt-1 text-sm font-extrabold">유나클린</div>
                  <div className="mt-1 text-sm text-emerald-700">{formatKRW(165000)} · 스팀 포함</div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => api.setRoute({ name: ROUTES.MESSAGES, params: {} })}
                  className="w-full"
                >
                  메시지로 이어가기
                </Button>
              </div>
            </div>
          </Card>

          <div className="text-xs text-neutral-500">
            ※ 실제 결제/알림/실명 인증/약관/정산 등은 프로덕션에서는 추가 구현이 필요합니다.
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-sm font-extrabold">{value}</div>
    </div>
  );
}

// -----------------------------
// Find Pros
// -----------------------------

function FindProsPage({ api, q, categoryId }) {
  const [query, setQuery] = useState(q || "");
  const [region, setRegion] = useState("");
  const [cat, setCat] = useState(categoryId || "");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sort, setSort] = useState("recommend");
  const [selectedProId, setSelectedProId] = useState(null);

  useEffect(() => setQuery(q || ""), [q]);
  useEffect(() => setCat(categoryId || ""), [categoryId]);

  const list = useMemo(() => {
    const base = api.db.pros
      .filter((p) => (onlyVerified ? p.verified : true))
      .filter((p) => (cat ? p.categories.includes(cat) : true))
      .filter((p) => {
        const r = String(region).trim().toLowerCase();
        if (!r) return true;
        return String(p.region || "").toLowerCase().includes(r);
      })
      .filter((p) => {
        const s = String(query).trim().toLowerCase();
        if (!s) return true;
        const hay = `${p.name} ${p.title} ${p.bio} ${(p.tags || []).join(" ")}`.toLowerCase();
        return hay.includes(s);
      })
      .map((p) => ({
        pro: p,
        score: scoreMatch({ pro: p, categoryId: cat, query, region }),
      }));

    base.sort((a, b) => {
      if (sort === "price") return (a.pro.minPrice || 0) - (b.pro.minPrice || 0);
      if (sort === "rating") return (b.pro.rating || 0) - (a.pro.rating || 0);
      if (sort === "fast") return (a.pro.responseTimeMin || 9999) - (b.pro.responseTimeMin || 9999);
      // recommend
      return b.score - a.score;
    });

    return base.map((x) => x.pro);
  }, [api.db.pros, cat, onlyVerified, query, region, sort]);

  const selectedPro = useMemo(() => api.db.pros.find((p) => p.id === selectedProId) || null, [api.db.pros, selectedProId]);

  const catLabel = useMemo(() => CATEGORIES.find((c) => c.id === cat)?.name || "전체", [cat]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-lg font-extrabold">고수 찾기</div>
          <div className="text-sm text-neutral-600">카테고리: {catLabel} · 결과 {list.length}명</div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <Icon name="search" className="h-5 w-5" />
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="키워드 (예: 스팀, React, 정찰제)"
              className="w-full rounded-2xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-neutral-400"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => api.setRoute({ name: ROUTES.REQUEST, params: {} })}
            className="whitespace-nowrap"
          >
            바로 견적 요청
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader title="필터" subtitle="조건을 바꿔가며 비교해보세요." />
        <CardBody>
          <div className="grid gap-3 lg:grid-cols-4">
            <Select label="카테고리" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">전체</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input label="지역" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="예: 서울, 경기" />
            <Select label="정렬" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="recommend">추천순</option>
              <option value="rating">평점순</option>
              <option value="fast">빠른응답순</option>
              <option value="price">낮은가격순</option>
            </Select>
            <label className="flex items-end gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
              <input type="checkbox" checked={onlyVerified} onChange={(e) => setOnlyVerified(e.target.checked)} />
              <div className="text-sm font-semibold">검증된 고수만</div>
            </label>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        {list.map((p) => (
          <ProCard
            key={p.id}
            pro={p}
            api={api}
            onOpenProfile={() => setSelectedProId(p.id)}
            onRequest={() => api.setRoute({ name: ROUTES.REQUEST, params: { categoryId: p.categories[0], suggestedProId: p.id } })}
          />
        ))}
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600 lg:col-span-2">
            조건에 맞는 고수가 없습니다. 키워드를 줄이거나 지역/카테고리를 변경해보세요.
          </div>
        ) : null}
      </div>

      <ProProfileModal
        open={Boolean(selectedPro)}
        pro={selectedPro}
        api={api}
        onClose={() => setSelectedProId(null)}
        onRequest={() => {
          if (!selectedPro) return;
          api.setRoute({ name: ROUTES.REQUEST, params: { categoryId: selectedPro.categories[0], suggestedProId: selectedPro.id } });
          setSelectedProId(null);
        }}
      />
    </div>
  );
}

function ProCard({ pro, api, onOpenProfile, onRequest }) {
  const catNames = pro.categories.map((id) => CATEGORIES.find((c) => c.id === id)?.name).filter(Boolean);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-lg" aria-hidden="true">
          {CATEGORIES.find((c) => c.id === pro.categories[0])?.icon || "✨"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-base font-extrabold">{pro.name}</div>
            {pro.verified ? <Badge tone="good">검증</Badge> : <Badge tone="neutral">일반</Badge>}
            <Badge tone="neutral">{catNames.join(" · ")}</Badge>
          </div>
          <div className="mt-1 text-sm text-neutral-600">{pro.title}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-extrabold">★ {pro.rating.toFixed(1)}</span>
            <span className="text-neutral-600">후기 {pro.reviewCount.toLocaleString("ko-KR")}</span>
            <span className="text-neutral-600">응답률 {pro.responseRate}%</span>
            <span className="text-neutral-600">평균 {pro.responseTimeMin}분</span>
          </div>
          <div className="mt-2 text-sm text-neutral-700">{safeText(pro.bio, 110)}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(pro.tags || []).slice(0, 4).map((t) => (
              <Badge key={t} tone="neutral">
                {t}
              </Badge>
            ))}
          </div>
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
          <div className="text-sm text-neutral-500">시작가</div>
          <div className="text-base font-extrabold">{formatKRW(pro.minPrice)}</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-neutral-600">활동 지역: {pro.region}</div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onOpenProfile}>
            프로필
          </Button>
          <Button
            onClick={() => {
              if (api.me?.role !== "customer") {
                api.pushToast({ tone: "warn", title: "고객 전용", message: "견적 요청은 고객 계정에서 가능합니다." });
                return;
              }
              onRequest?.();
            }}
          >
            견적 요청
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ProProfileModal({ open, pro, api, onClose, onRequest }) {
  if (!pro) return null;
  const catNames = pro.categories.map((id) => CATEGORIES.find((c) => c.id === id)?.name).filter(Boolean);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${pro.name} · ${pro.title}`}
      description={`${catNames.join(" · ")} · ${pro.region}`}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-neutral-600">
            시작가 <span className="font-extrabold text-neutral-900">{formatKRW(pro.minPrice)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              닫기
            </Button>
            <Button
              onClick={() => {
                if (api.me?.role !== "customer") {
                  api.pushToast({ tone: "warn", title: "고객 전용", message: "견적 요청은 고객 계정에서 가능합니다." });
                  return;
                }
                onRequest?.();
              }}
            >
              견적 요청
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatBox label="평점" value={`★ ${pro.rating.toFixed(1)}`} />
          <StatBox label="후기" value={`${pro.reviewCount.toLocaleString("ko-KR")}개`} />
          <StatBox label="응답" value={`${pro.responseRate}% · ${pro.responseTimeMin}분`} />
        </div>

        <Card>
          <CardHeader title="소개" subtitle="고수의 작업 방식/원칙" />
          <CardBody>
            <p className="text-sm text-neutral-700">{pro.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(pro.tags || []).map((t) => (
                <Badge key={t} tone="neutral">
                  {t}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="핵심 포인트" subtitle="요청 전 확인해보세요." />
          <CardBody>
            <ul className="list-disc pl-5 text-sm text-neutral-700">
              {(pro.highlights || []).map((h) => (
                <li key={h} className="mt-1">
                  {h}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          <div className="font-extrabold">안전 팁</div>
          <div className="mt-1 text-sm text-neutral-600">
            계약 전 범위/추가요금/취소 규정을 메시지로 남기고, 영수증/견적서를 보관하세요.
          </div>
        </div>
      </div>
    </Modal>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-sm font-extrabold">{value}</div>
    </div>
  );
}

// -----------------------------
// Request Wizard
// -----------------------------

function RequestWizardPage({ api }) {
  const suggestedCat = api?.db ? null : null;
  const [step, setStep] = useState(1);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [region, setRegion] = useState(api.me?.region || "서울");
  const [scheduleType, setScheduleType] = useState("date");
  const [scheduleValue, setScheduleValue] = useState(() => new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().slice(0, 10));
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [inviteMode, setInviteMode] = useState("smart"); // smart | pick
  const [pickedProIds, setPickedProIds] = useState([]);
  const [errors, setErrors] = useState({});
  const [createdRequestId, setCreatedRequestId] = useState(null);

  // route params
  useEffect(() => {
    const params = api?.db ? null : null;
    // no-op
  }, [api]);

  useEffect(() => {
    // preload suggested params if any
    const params = window?.__gosu_route_params_placeholder; // not used
    void params;
  }, []);

  const routeCategoryId = useMemo(() => {
    // We can access route params by reading current URL? Not used here.
    return null;
  }, []);
  void suggestedCat;
  void routeCategoryId;

  // prefill using api route params if exists
  useEffect(() => {
    // This component is mounted inside router; params stored in api.setRoute
    // We'll read them via a tiny hack: the router passes none. So instead,
    // we keep wizard self-contained and allow selection.
  }, []);

  const matchingPros = useMemo(() => {
    const base = api.db.pros.map((p) => ({
      pro: p,
      score: scoreMatch({ pro: p, categoryId, query: title + " " + detail, region }),
    }));
    base.sort((a, b) => b.score - a.score);
    const filtered = categoryId ? base.filter((x) => x.pro.categories.includes(categoryId)) : base;
    return filtered.slice(0, 6).map((x) => x.pro);
  }, [api.db.pros, categoryId, detail, region, title]);

  const stepLabel = useMemo(() => {
    const map = {
      1: "서비스 선택",
      2: "요청 내용",
      3: "일정/예산",
      4: "고수 선택",
      5: "검토/전송",
    };
    return map[step] || "";
  }, [step]);

  const validateStep = (s) => {
    const e = {};
    if (s >= 1) {
      if (!categoryId) e.categoryId = "서비스를 선택해주세요.";
    }
    if (s >= 2) {
      if (!String(title).trim()) e.title = "제목을 입력해주세요.";
      if (String(title).trim().length < 4) e.title = "제목은 4자 이상 권장합니다.";
      if (!String(detail).trim()) e.detail = "요청 상세를 입력해주세요.";
      if (String(detail).trim().length < 12) e.detail = "상세는 12자 이상 권장합니다.";
      if (!String(region).trim()) e.region = "지역을 입력해주세요.";
    }
    if (s >= 3) {
      if (scheduleType === "date" && !scheduleValue) e.schedule = "날짜를 선택해주세요.";
      const min = budgetMin ? Number(budgetMin) : null;
      const max = budgetMax ? Number(budgetMax) : null;
      if (min != null && Number.isNaN(min)) e.budgetMin = "숫자만 입력해주세요.";
      if (max != null && Number.isNaN(max)) e.budgetMax = "숫자만 입력해주세요.";
      if (min != null && max != null && min > max) e.budgetMax = "최대 예산은 최소 예산 이상이어야 합니다.";
    }
    if (s >= 4) {
      if (inviteMode === "pick" && pickedProIds.length === 0) e.invite = "고수를 1명 이상 선택해주세요.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canProceed = () => validateStep(step);

  const catObj = CATEGORIES.find((c) => c.id === categoryId);

  if (api.me?.role !== "customer") {
    return (
      <Card>
        <CardHeader title="견적 요청" subtitle="이 기능은 고객 계정에서 사용 가능합니다." />
        <CardBody>
          <p className="text-sm text-neutral-600">상단의 “전환”에서 고객 계정으로 바꾼 뒤 이용해주세요.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-lg font-extrabold">견적 요청</div>
          <div className="text-sm text-neutral-600">Step {step}/5 · {stepLabel}</div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Badge tone="neutral">고객 · {api.me?.name}</Badge>
        </div>
      </div>

      {createdRequestId ? (
        <AfterRequestCreated api={api} requestId={createdRequestId} onReset={() => {
          setCreatedRequestId(null);
          setStep(1);
          setCategoryId("");
          setTitle("");
          setDetail("");
          setBudgetMin("");
          setBudgetMax("");
          setPickedProIds([]);
          setInviteMode("smart");
        }} />
      ) : (
        <Card>
          <CardHeader
            title={stepLabel}
            subtitle="입력한 정보는 전송 전까지 저장되지 않습니다."
            right={<Badge tone="neutral">5단계</Badge>}
          />
          <CardBody>
            <div className="grid gap-4">
              {step === 1 ? (
                <div className="grid gap-3">
                  <div className="text-sm font-extrabold">서비스 선택</div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {CATEGORIES.map((c) => {
                      const active = categoryId === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setCategoryId(c.id)}
                          className={cx(
                            "rounded-2xl border p-4 text-left transition",
                            active ? "border-black bg-black text-white" : "border-neutral-200 bg-white hover:bg-neutral-50"
                          )}
                        >
                          <div className="text-2xl">{c.icon}</div>
                          <div className="mt-2 text-sm font-extrabold">{c.name}</div>
                          <div className={cx("mt-1 text-xs", active ? "text-white/80" : "text-neutral-600")}>{c.hint}</div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.categoryId ? <div className="text-sm font-semibold text-red-600">{errors.categoryId}</div> : null}
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid gap-3">
                  <div className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-700">
                    <div className="font-extrabold">선택한 서비스</div>
                    <div className="mt-1 text-sm text-neutral-600">
                      {catObj ? `${catObj.icon} ${catObj.name}` : "-"}
                    </div>
                  </div>
                  <Input
                    label="요청 제목"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    error={errors.title}
                    hint="예: 투룸 이사청소, 배관 누수 점검, React 랜딩페이지 제작"
                  />
                  <Textarea
                    label="요청 상세"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    error={errors.detail}
                    hint="범위/현재 상태/희망 방식/특이사항을 적어주세요."
                    rows={5}
                  />
                  <Input label="지역" value={region} onChange={(e) => setRegion(e.target.value)} error={errors.region} />
                </div>
              ) : null}

              {step === 3 ? (
                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select label="희망 일정" value={scheduleType} onChange={(e) => setScheduleType(e.target.value)}>
                      <option value="date">날짜 지정</option>
                      <option value="flex">협의</option>
                    </Select>
                    {scheduleType === "date" ? (
                      <Input
                        label="날짜"
                        type="date"
                        value={scheduleValue}
                        onChange={(e) => setScheduleValue(e.target.value)}
                        error={errors.schedule}
                      />
                    ) : (
                      <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
                        일정은 메시지로 협의합니다.
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="예산 최소(선택)"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value.replace(/[^0-9]/g, ""))}
                      error={errors.budgetMin}
                      hint="숫자만 입력"
                    />
                    <Input
                      label="예산 최대(선택)"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value.replace(/[^0-9]/g, ""))}
                      error={errors.budgetMax}
                      hint="숫자만 입력"
                    />
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                    <div className="font-extrabold">추천 고수 미리보기</div>
                    <div className="mt-1 text-sm text-neutral-600">요청 내용 기반으로 추천됩니다.</div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {matchingPros.slice(0, 4).map((p) => (
                        <div key={p.id} className="rounded-2xl border border-neutral-200 bg-white p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-extrabold">{p.name}</div>
                            <div className="text-xs text-neutral-600">★ {p.rating.toFixed(1)}</div>
                          </div>
                          <div className="mt-1 text-xs text-neutral-600">{p.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className={cx(
                        "rounded-full px-3 py-1.5 text-sm font-semibold",
                        inviteMode === "smart" ? "bg-black text-white" : "bg-neutral-100 hover:bg-neutral-200"
                      )}
                      onClick={() => setInviteMode("smart")}
                      type="button"
                    >
                      추천 고수에게 자동 전송
                    </button>
                    <button
                      className={cx(
                        "rounded-full px-3 py-1.5 text-sm font-semibold",
                        inviteMode === "pick" ? "bg-black text-white" : "bg-neutral-100 hover:bg-neutral-200"
                      )}
                      onClick={() => setInviteMode("pick")}
                      type="button"
                    >
                      직접 고수 선택
                    </button>
                  </div>

                  {inviteMode === "smart" ? (
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                      <div className="font-extrabold">자동 전송 방식</div>
                      <div className="mt-1 text-sm text-neutral-600">
                        입력한 내용과 지역/카테고리를 바탕으로 상위 3~5명의 고수에게 견적 요청이 전송됩니다.
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {matchingPros.slice(0, 6).map((p) => (
                          <div key={p.id} className="rounded-2xl border border-neutral-200 bg-white p-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-extrabold">{p.name}</div>
                              {p.verified ? <Badge tone="good">검증</Badge> : <Badge tone="neutral">일반</Badge>}
                            </div>
                            <div className="mt-1 text-xs text-neutral-600">응답 {p.responseRate}% · {p.responseTimeMin}분</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {errors.invite ? <div className="text-sm font-semibold text-red-600">{errors.invite}</div> : null}
                      <div className="grid gap-2 sm:grid-cols-2">
                        {api.db.pros
                          .filter((p) => (categoryId ? p.categories.includes(categoryId) : true))
                          .slice(0, 10)
                          .map((p) => {
                            const checked = pickedProIds.includes(p.id);
                            return (
                              <label
                                key={p.id}
                                className={cx(
                                  "flex cursor-pointer items-start gap-3 rounded-2xl border p-4",
                                  checked ? "border-black bg-black text-white" : "border-neutral-200 bg-white hover:bg-neutral-50"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...pickedProIds, p.id]
                                      : pickedProIds.filter((x) => x !== p.id);
                                    setPickedProIds(next);
                                  }}
                                  className="mt-1"
                                />
                                <div className="min-w-0">
                                  <div className="text-sm font-extrabold">{p.name}</div>
                                  <div className={cx("mt-1 text-xs", checked ? "text-white/80" : "text-neutral-600")}>
                                    {p.title} · ★ {p.rating.toFixed(1)} · {p.region}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {step === 5 ? (
                <div className="grid gap-4">
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="text-sm font-extrabold">요청 요약</div>
                    <div className="mt-2 grid gap-2 text-sm text-neutral-700">
                      <SummaryRow k="서비스" v={catObj ? `${catObj.icon} ${catObj.name}` : "-"} />
                      <SummaryRow k="제목" v={title || "-"} />
                      <SummaryRow k="지역" v={region || "-"} />
                      <SummaryRow
                        k="일정"
                        v={
                          scheduleType === "flex"
                            ? "협의"
                            : scheduleValue
                            ? `${scheduleValue} (예정)`
                            : "-"
                        }
                      />
                      <SummaryRow
                        k="예산"
                        v={
                          budgetMin || budgetMax
                            ? `${budgetMin ? formatKRW(Number(budgetMin)) : "-"} ~ ${budgetMax ? formatKRW(Number(budgetMax)) : "-"}`
                            : "미정"
                        }
                      />
                      <SummaryRow
                        k="전송"
                        v={
                          inviteMode === "smart"
                            ? `추천 고수 ${matchingPros.slice(0, 5).length}명`
                            : `선택 고수 ${pickedProIds.length}명`
                        }
                      />
                    </div>
                  </div>

                  <Card>
                    <CardHeader title="요청 상세" subtitle="전송 전 마지막으로 확인하세요." />
                    <CardBody>
                      <p className="whitespace-pre-wrap text-sm text-neutral-700">{detail}</p>
                    </CardBody>
                  </Card>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <div className="font-extrabold">주의</div>
                    <div className="mt-1 text-sm text-amber-800">
                      개인정보(주민번호, 카드번호 등)는 메시지로 공유하지 마세요.
                    </div>
                  </div>
                </div>
              ) : null}

              <Divider />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (step === 1) {
                      api.setRoute({ name: ROUTES.HOME, params: {} });
                      return;
                    }
                    setStep((s) => clamp(s - 1, 1, 5));
                  }}
                >
                  {step === 1 ? "홈으로" : "이전"}
                </Button>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {step < 5 ? (
                    <Button
                      onClick={() => {
                        if (!canProceed()) {
                          api.pushToast({ tone: "warn", title: "입력 확인", message: "필수 항목을 확인해주세요." });
                          return;
                        }
                        setStep((s) => clamp(s + 1, 1, 5));
                      }}
                    >
                      다음
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        if (!validateStep(5)) {
                          api.pushToast({ tone: "warn", title: "입력 확인", message: "요청 내용을 확인해주세요." });
                          return;
                        }

                        const invitedProIds =
                          inviteMode === "smart"
                            ? matchingPros.slice(0, 5).map((p) => p.id)
                            : pickedProIds;

                        const reqId = api.createRequest({
                          categoryId,
                          title: safeText(title, 80),
                          detail: safeText(detail, 2000),
                          region: safeText(region, 60),
                          schedule: {
                            type: scheduleType,
                            value: scheduleType === "flex" ? null : new Date(scheduleValue + "T09:00:00").getTime(),
                          },
                          budgetMin: budgetMin ? Number(budgetMin) : null,
                          budgetMax: budgetMax ? Number(budgetMax) : null,
                          invitedProIds,
                        });

                        // Ensure threads for invited pros
                        invitedProIds.forEach((pid) => api.ensureThread(reqId, pid));

                        setCreatedRequestId(reqId);
                      }}
                    >
                      요청 전송
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function SummaryRow({ k, v }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="shrink-0 text-neutral-500">{k}</div>
      <div className="min-w-0 text-right font-semibold text-neutral-900">{v}</div>
    </div>
  );
}

function AfterRequestCreated({ api, requestId, onReset }) {
  const req = api.db.requests.find((r) => r.id === requestId);
  const invited = (req?.invitedProIds || []).map((id) => api.db.pros.find((p) => p.id === id)).filter(Boolean);

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader title="요청이 전송되었습니다" subtitle="고수의 견적이 도착하면 메시지로 안내됩니다." />
        <CardBody>
          <div className="grid gap-3">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-sm font-extrabold">요청 정보</div>
              <div className="mt-1 text-sm text-neutral-700">{req?.title}</div>
              <div className="mt-1 text-sm text-neutral-600">{req?.region} · {formatDateTime(req?.createdAt)}</div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="text-sm font-extrabold">전송 대상</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {invited.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-extrabold">{p.name}</div>
                      <div className="text-xs text-neutral-600">응답 {p.responseRate}%</div>
                    </div>
                    <div className="mt-1 text-xs text-neutral-600">{p.title}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => api.setRoute({ name: ROUTES.MESSAGES, params: {} })} className="w-full sm:w-auto">
                메시지 보기
              </Button>
              <Button variant="secondary" onClick={() => api.setRoute({ name: ROUTES.ORDERS, params: {} })} className="w-full sm:w-auto">
                주문 보기
              </Button>
              <Button variant="secondary" onClick={onReset} className="w-full sm:w-auto">
                새 요청 만들기
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="다음 단계" subtitle="견적 비교 → 예약" />
        <CardBody>
          <ol className="list-decimal pl-5 text-sm text-neutral-700">
            <li className="mt-1">고수로부터 견적이 도착하면 “메시지”에서 대화를 시작하세요.</li>
            <li className="mt-1">범위/추가요금/일정을 합의하고 “예약”을 진행하세요.</li>
            <li className="mt-1">작업 완료 후 후기/평점(데모에서는 간단히 구현 가능)을 남겨보세요.</li>
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}

// -----------------------------
// Messages
// -----------------------------

function MessagesPage({ api }) {
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [text, setText] = useState("");

  const threads = useMemo(() => {
    const list = [...api.db.threads];
    // filter by role
    if (api.me?.role === "customer") {
      return list.filter((t) => t.customerId === api.me.id).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }
    if (api.me?.role === "pro") {
      const pid = api.activePro?.id;
      return list.filter((t) => t.proId === pid).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }
    return list;
  }, [api.db.threads, api.me?.id, api.me?.role, api.activePro?.id]);

  useEffect(() => {
    if (!selectedThreadId && threads[0]?.id) setSelectedThreadId(threads[0].id);
  }, [selectedThreadId, threads]);

  const selected = useMemo(() => threads.find((t) => t.id === selectedThreadId) || null, [threads, selectedThreadId]);
  const req = useMemo(() => (selected ? api.db.requests.find((r) => r.id === selected.requestId) : null), [api.db.requests, selected]);
  const pro = useMemo(() => (selected ? api.db.pros.find((p) => p.id === selected.proId) : null), [api.db.pros, selected]);
  const customer = useMemo(() => (selected ? api.db.users.find((u) => u.id === selected.customerId) : null), [api.db.users, selected]);

  const send = async () => {
    if (!selected) return;
    const sender = api.me?.role === "pro" ? "pro" : "customer";
    const prefix = sender === "pro" ? `${api.activePro?.name || "고수"}: ` : "";
    await api.sendMessage({ threadId: selected.id, sender, text: prefix + text });
    setText("");
  };

  const canBook = useMemo(() => {
    if (!req || api.me?.role !== "customer") return false;
    if (!req.quotes?.length) return false;
    return req.status !== "booked" && req.status !== "done";
  }, [api.me?.role, req]);

  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-lg font-extrabold">메시지</div>
          <div className="text-sm text-neutral-600">요청과 연결된 대화가 표시됩니다.</div>
        </div>
        <Badge tone={api.me?.role === "pro" ? "info" : "good"}>
          {api.me?.role === "pro" ? "고수" : "고객"}
        </Badge>
      </div>

      <div className="grid gap-3 lg:grid-cols-[360px_1fr]">
        <Card className="overflow-hidden">
          <div className="border-b bg-neutral-50 px-5 py-3">
            <div className="text-sm font-extrabold">대화 목록</div>
          </div>
          <div className="max-h-[70vh] overflow-auto p-3">
            {threads.length === 0 ? (
              <div className="p-4 text-sm text-neutral-600">아직 대화가 없습니다. 견적 요청을 먼저 등록해보세요.</div>
            ) : (
              <div className="grid gap-2">
                {threads.map((t) => {
                  const r = api.db.requests.find((x) => x.id === t.requestId);
                  const p = api.db.pros.find((x) => x.id === t.proId);
                  const isActive = t.id === selectedThreadId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedThreadId(t.id)}
                      className={cx(
                        "rounded-2xl border p-3 text-left transition",
                        isActive ? "border-black bg-black text-white" : "border-neutral-200 bg-white hover:bg-neutral-50"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate text-sm font-extrabold">{api.me?.role === "pro" ? r?.title : p?.name}</div>
                        <div className={cx("text-xs", isActive ? "text-white/80" : "text-neutral-500")}>
                          {formatDateTime(t.updatedAt)}
                        </div>
                      </div>
                      <div className={cx("mt-1 truncate text-xs", isActive ? "text-white/80" : "text-neutral-600")}>
                        {r?.title || "요청"} · {p?.title || ""}
                      </div>
                      <div className={cx("mt-2 line-clamp-2 text-xs", isActive ? "text-white/80" : "text-neutral-600")}>
                        {t.messages?.[t.messages.length - 1]?.text || ""}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b bg-neutral-50 px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold">
                  {selected ? (api.me?.role === "pro" ? customer?.name : pro?.name) : "대화를 선택하세요"}
                </div>
                <div className="text-xs text-neutral-600">{req ? `${req.title} · ${req.region}` : ""}</div>
              </div>
              <div className="flex gap-2">
                {canBook ? (
                  <Button
                    onClick={() => {
                      const first = req.quotes[0];
                      api.bookOrder({ requestId: req.id, quoteId: first.id });
                      api.setRoute({ name: ROUTES.ORDERS, params: {} });
                    }}
                  >
                    첫 견적으로 예약
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => api.setRoute({ name: ROUTES.FIND, params: { categoryId: req?.categoryId } })}>
                    다른 고수 보기
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-[56vh] overflow-auto px-5 py-4">
            {selected ? (
              <MessageList messages={selected.messages || []} meRole={api.me?.role} />
            ) : (
              <div className="text-sm text-neutral-600">왼쪽에서 대화를 선택해주세요.</div>
            )}
          </div>

          <div className="border-t bg-white px-5 py-4">
            <div className="flex items-end gap-2">
              <Textarea
                label={null}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="메시지를 입력하세요…"
                rows={2}
                className="flex-1"
              />
              <Button
                onClick={send}
                disabled={!selected || !String(text).trim()}
                className="h-[44px]"
                aria-label="전송"
              >
                전송
              </Button>
            </div>
            <div className="mt-2 text-xs text-neutral-500">※ 데모: 고객 메시지 전송 시 간단한 자동응답이 표시될 수 있습니다.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MessageList({ messages, meRole }) {
  return (
    <div className="grid gap-2">
      {messages.map((m) => {
        const isMine = (meRole === "pro" && m.sender === "pro") || (meRole !== "pro" && m.sender === "customer");
        return (
          <div key={m.id} className={cx("flex", isMine ? "justify-end" : "justify-start")}>
            <div
              className={cx(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                isMine ? "bg-black text-white" : "bg-neutral-100 text-neutral-900"
              )}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
              <div className={cx("mt-1 text-[11px]", isMine ? "text-white/70" : "text-neutral-500")}>
                {formatDateTime(m.createdAt)}
              </div>
            </div>
          </div>
        );
      })}
      {messages.length === 0 ? <div className="text-sm text-neutral-600">아직 메시지가 없습니다.</div> : null}
    </div>
  );
}

// -----------------------------
// Orders
// -----------------------------

function OrdersPage({ api }) {
  const orders = useMemo(() => {
    const list = [...api.db.orders];
    if (api.me?.role === "customer") return list.filter((o) => o.customerId === api.me.id);
    if (api.me?.role === "pro") return list.filter((o) => o.proId === api.activePro?.id);
    return list;
  }, [api.db.orders, api.me?.id, api.me?.role, api.activePro?.id]);

  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-lg font-extrabold">주문</div>
          <div className="text-sm text-neutral-600">예약/진행/완료 상태를 관리합니다.</div>
        </div>
        <Badge tone={api.me?.role === "pro" ? "info" : "good"}>{api.me?.role}</Badge>
      </div>

      <div className="grid gap-3">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} api={api} />
        ))}
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
            아직 주문이 없습니다. 견적을 예약하면 주문이 생성됩니다.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function OrderCard({ order, api }) {
  const req = api.db.requests.find((r) => r.id === order.requestId);
  const pro = api.db.pros.find((p) => p.id === order.proId);
  const customer = api.db.users.find((u) => u.id === order.customerId);

  const statusLabel = {
    booked: "예약됨",
    in_progress: "진행중",
    done: "완료",
    cancelled: "취소",
  }[order.status];

  const tone = order.status === "done" ? "good" : order.status === "cancelled" ? "warn" : order.status === "in_progress" ? "info" : "neutral";

  return (
    <Card>
      <CardHeader
        title={req?.title || "주문"}
        subtitle={`${req?.region || ""} · ${formatDateTime(order.createdAt)}`}
        right={<Badge tone={tone}>{statusLabel}</Badge>}
      />
      <CardBody>
        <div className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs text-neutral-500">고수</div>
              <div className="mt-1 text-sm font-extrabold">{pro?.name || "-"}</div>
              <div className="mt-1 text-xs text-neutral-600">{pro?.title}</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs text-neutral-500">고객</div>
              <div className="mt-1 text-sm font-extrabold">{customer?.name || "-"}</div>
              <div className="mt-1 text-xs text-neutral-600">{customer?.phone || ""}</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs text-neutral-500">금액</div>
              <div className="mt-1 text-sm font-extrabold">{formatKRW(order.price)}</div>
              <div className="mt-1 text-xs text-neutral-600">견적 기준</div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="secondary"
              onClick={() => {
                // jump to thread
                const th = api.db.threads.find((t) => t.requestId === order.requestId && t.proId === order.proId);
                if (!th) {
                  api.pushToast({ tone: "warn", title: "대화 없음", message: "연결된 대화가 없습니다." });
                  return;
                }
                api.setRoute({ name: ROUTES.MESSAGES, params: { threadId: th.id } });
              }}
            >
              메시지로 이동
            </Button>

            {api.me?.role === "pro" ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={order.status !== "booked"}
                  onClick={() => api.updateOrderStatus(order.id, "in_progress")}
                >
                  진행중
                </Button>
                <Button
                  disabled={order.status !== "in_progress"}
                  onClick={() => api.updateOrderStatus(order.id, "done")}
                >
                  완료
                </Button>
                <Button
                  variant="danger"
                  disabled={order.status === "done" || order.status === "cancelled"}
                  onClick={() => api.updateOrderStatus(order.id, "cancelled")}
                >
                  취소
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="danger"
                  disabled={order.status === "done" || order.status === "cancelled"}
                  onClick={() => api.updateOrderStatus(order.id, "cancelled")}
                >
                  취소 요청
                </Button>
              </div>
            )}
          </div>

          {req?.quotes?.length ? (
            <details className="rounded-2xl border border-neutral-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-extrabold">연결된 견적 보기</summary>
              <div className="mt-3 grid gap-2">
                {req.quotes.map((q) => {
                  const qp = api.db.pros.find((p) => p.id === q.proId);
                  return (
                    <div key={q.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-extrabold">{qp?.name}</div>
                        <div className="text-sm font-extrabold">{formatKRW(q.price)}</div>
                      </div>
                      <div className="mt-1 text-sm text-neutral-700">{q.message}</div>
                      <div className="mt-1 text-xs text-neutral-500">{formatDateTime(q.createdAt)}</div>
                    </div>
                  );
                })}
              </div>
            </details>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}

// -----------------------------
// Account
// -----------------------------

function AccountPage({ api }) {
  const [name, setName] = useState(api.me?.name || "");
  const [phone, setPhone] = useState(api.me?.phone || "");
  const [region, setRegion] = useState(api.me?.region || "");
  const [openAudit, setOpenAudit] = useState(false);

  useEffect(() => {
    setName(api.me?.name || "");
    setPhone(api.me?.phone || "");
    setRegion(api.me?.region || "");
  }, [api.me?.id]);

  const save = () => {
    api.pushToast({ tone: "good", title: "저장", message: "데모에서는 간단 저장만 지원합니다." });
    // Update in db
    api.setSession((s) => s); // no-op to keep API stable
    // direct update
    const next = structuredClone(api.db);
    const u = next.users.find((x) => x.id === api.me.id);
    if (u) {
      u.name = safeText(name, 40);
      u.phone = safeText(phone, 30);
      u.region = safeText(region, 60);
      addAudit(next, `프로필 수정: ${u.name}`);
      saveDB(next);
      // reflect to app state (via localStorageState)
      window.dispatchEvent(new Event("storage"));
    }
    // This page uses api.db snapshot; easiest is reload toast only
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-lg font-extrabold">계정</div>
          <div className="text-sm text-neutral-600">프로필 및 데모 설정을 관리합니다.</div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => api.signOut()}>
            로그아웃
          </Button>
          <Button variant="secondary" onClick={() => api.resetDB()}>
            초기화
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader title="내 프로필" subtitle="이름/연락처/지역" right={<Badge tone={api.me?.role === "pro" ? "info" : "good"}>{api.me?.role}</Badge>} />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="이름" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="전화번호" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="지역" value={region} onChange={(e) => setRegion(e.target.value)} className="sm:col-span-2" />
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-neutral-500">※ 데모: 일부 항목은 간단 저장으로만 동작합니다.</div>
            <Button onClick={save}>저장</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="데모 로그"
          subtitle="요청/견적/메시지 기록(간단)"
          right={
            <Button variant="secondary" onClick={() => setOpenAudit(true)}>
              보기
            </Button>
          }
        />
        <CardBody>
          <div className="text-sm text-neutral-600">최근 활동을 확인할 수 있습니다(로컬 기반).</div>
        </CardBody>
      </Card>

      <Modal
        open={openAudit}
        onClose={() => setOpenAudit(false)}
        title="데모 로그"
        description="최근 작업 내역(간단)"
        footer={<Button variant="secondary" onClick={() => setOpenAudit(false)}>닫기</Button>}
      >
        <div className="grid gap-2">
          {(api.db.audit || []).slice(0, 50).map((a) => (
            <div key={a.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
              <div className="flex items-center justify-between">
                <Badge tone={a.type === "info" ? "info" : a.type === "seed" ? "neutral" : "neutral"}>{a.type}</Badge>
                <div className="text-xs text-neutral-500">{formatDateTime(a.createdAt)}</div>
              </div>
              <div className="mt-2 text-sm text-neutral-800">{a.message}</div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

// -----------------------------
// Pro Dashboard
// -----------------------------

function ProDashboardPage({ api }) {
  if (api.me?.role !== "pro") {
    return (
      <Card>
        <CardHeader title="고수 대시보드" subtitle="이 기능은 고수 계정에서 사용 가능합니다." />
        <CardBody>
          <p className="text-sm text-neutral-600">상단의 “전환”에서 고수 계정으로 바꾼 뒤 이용해주세요.</p>
        </CardBody>
      </Card>
    );
  }

  const myPro = api.activePro;
  const relatedRequests = api.db.requests
    .filter((r) => (r.invitedProIds || []).includes(myPro?.id))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-lg font-extrabold">고수 대시보드</div>
          <div className="text-sm text-neutral-600">견적 요청을 확인하고 견적을 보내세요.</div>
        </div>
        <Badge tone="info">{myPro?.name}</Badge>
      </div>

      <Card>
        <CardHeader title="내 프로필" subtitle="공개 지표" />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatBox label="평점" value={`★ ${myPro?.rating?.toFixed?.(1) ?? "-"}`} />
            <StatBox label="후기" value={`${(myPro?.reviewCount ?? 0).toLocaleString("ko-KR")}개`} />
            <StatBox label="응답" value={`${myPro?.responseRate ?? "-"}% · ${myPro?.responseTimeMin ?? "-"}분`} />
          </div>
          <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
            <div className="font-extrabold">소개</div>
            <div className="mt-1 text-sm text-neutral-600">{myPro?.bio}</div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="들어온 요청" subtitle={`총 ${relatedRequests.length}건`} />
        <CardBody>
          <div className="grid gap-3">
            {relatedRequests.map((r) => (
              <ProRequestCard key={r.id} req={r} api={api} myPro={myPro} />
            ))}
            {relatedRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
                아직 요청이 없습니다.
              </div>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="운영 팁" subtitle="프로덕션에서 고려할 요소" />
        <CardBody>
          <ul className="list-disc pl-5 text-sm text-neutral-700">
            <li className="mt-1">고수 검증(사업자/경력), 신고/제재, 결제/정산, 약관/개인정보 처리</li>
            <li className="mt-1">견적/예약 단계별 알림(푸시/이메일/문자), SLA 모니터링</li>
            <li className="mt-1">분쟁 대응(증빙 첨부), 리뷰 검수, 검색 랭킹/품질 지표</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

function ProRequestCard({ req, api, myPro }) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [msg, setMsg] = useState("");

  const cat = CATEGORIES.find((c) => c.id === req.categoryId);
  const alreadyQuoted = (req.quotes || []).some((q) => q.proId === myPro.id);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{cat ? `${cat.icon} ${cat.name}` : ""}</Badge>
            <div className="truncate text-sm font-extrabold">{req.title}</div>
            {alreadyQuoted ? <Badge tone="good">견적 완료</Badge> : <Badge tone="warn">미견적</Badge>}
          </div>
          <div className="mt-1 text-sm text-neutral-600">{req.region} · {formatDateTime(req.createdAt)}</div>
          <div className="mt-2 text-sm text-neutral-700">{safeText(req.detail, 140)}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            상세/견적
          </Button>
          <Button
            onClick={() => {
              const th = api.ensureThread(req.id, myPro.id);
              api.setRoute({ name: ROUTES.MESSAGES, params: { threadId: th?.id } });
            }}
          >
            메시지
          </Button>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="요청 상세 및 견적 보내기"
        description="견적은 신중히 작성해주세요. 범위/추가요금/일정을 명확히 안내하는 것이 좋습니다."
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-neutral-500">이미 견적을 보낸 경우에도 추가 견적은 가능합니다(데모).</div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                닫기
              </Button>
              <Button
                onClick={() => {
                  const p = Number(price);
                  if (!price || Number.isNaN(p) || p < 0) {
                    api.pushToast({ tone: "warn", title: "금액 확인", message: "견적 금액을 올바르게 입력해주세요." });
                    return;
                  }
                  if (!String(msg).trim()) {
                    api.pushToast({ tone: "warn", title: "메시지 확인", message: "견적 메시지를 작성해주세요." });
                    return;
                  }
                  api.submitQuote({ requestId: req.id, proId: myPro.id, price: p, message: msg });
                  setOpen(false);
                  setPrice("");
                  setMsg("");
                }}
              >
                견적 전송
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid gap-4">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="text-sm font-extrabold">요청</div>
            <div className="mt-1 text-sm text-neutral-700">{req.title}</div>
            <div className="mt-1 text-sm text-neutral-600">{req.region}</div>
            <div className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">{req.detail}</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <StatBox
                label="일정"
                value={req.schedule?.type === "flex" ? "협의" : req.schedule?.value ? new Date(req.schedule.value).toISOString().slice(0, 10) : "-"}
              />
              <StatBox
                label="예산"
                value={
                  req.budgetMin || req.budgetMax
                    ? `${req.budgetMin ? formatKRW(req.budgetMin) : "-"} ~ ${req.budgetMax ? formatKRW(req.budgetMax) : "-"}`
                    : "미정"
                }
              />
              <StatBox label="상태" value={req.status} />
            </div>
          </div>

          <Card>
            <CardHeader title="견적 작성" subtitle="금액 + 안내 메시지" />
            <CardBody>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="견적 금액"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
                  hint="숫자만"
                />
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
                  <div className="text-xs text-neutral-500">입력값 미리보기</div>
                  <div className="mt-1 text-sm font-extrabold">{price ? formatKRW(Number(price)) : "-"}</div>
                </div>
              </div>
              <Textarea
                label="견적 메시지"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                rows={4}
                hint="예: 포함 범위, 추가요금 기준, 준비물, 소요시간, 일정 제안"
              />
            </CardBody>
          </Card>

          {req.quotes?.length ? (
            <Card>
              <CardHeader title="도착한 견적" subtitle="다른 고수 견적도 함께 표시됩니다." />
              <CardBody>
                <div className="grid gap-2">
                  {req.quotes.map((q) => {
                    const qp = api.db.pros.find((p) => p.id === q.proId);
                    return (
                      <div key={q.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-extrabold">{qp?.name}</div>
                          <div className="text-sm font-extrabold">{formatKRW(q.price)}</div>
                        </div>
                        <div className="mt-1 text-sm text-neutral-700">{q.message}</div>
                        <div className="mt-1 text-xs text-neutral-500">{formatDateTime(q.createdAt)}</div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

// -----------------------------
// Footer
// -----------------------------

function Footer({ api }) {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
        <div className="grid gap-3 sm:grid-cols-2 sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-extrabold">고수(Gosu) 데모</div>
            <div className="mt-1 text-xs text-neutral-500">
              React 단일 파일 데모 · 로컬스토리지 저장 · 프로덕션급 기능을 단순화한 예시
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button variant="secondary" size="sm" onClick={() => api.setRoute({ name: ROUTES.REQUEST, params: {} })}>
              견적 요청
            </Button>
            <Button variant="secondary" size="sm" onClick={() => api.setRoute({ name: ROUTES.FIND, params: {} })}>
              고수 찾기
            </Button>
            <Button variant="secondary" size="sm" onClick={() => api.resetDB()}>
              초기화
            </Button>
          </div>
        </div>

        <Divider className="my-4" />

        <div className="text-xs text-neutral-500">
          © {new Date().getFullYear()} Gosu Demo. (예시 프로젝트)
        </div>
      </div>
    </footer>
  );
}

export default App;
