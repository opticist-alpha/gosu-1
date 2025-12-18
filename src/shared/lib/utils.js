export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const uid = (prefix = "id") => `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;

export const cx = (...args) =>
  args
    .flatMap((a) => {
      if (!a) return [];
      if (typeof a === "string") return [a];
      if (Array.isArray(a)) return a.filter(Boolean);
      if (typeof a === "object") return Object.entries(a).filter(([, v]) => Boolean(v)).map(([k]) => k);
      return [];
    })
    .join(" ");

export const safeText = (text, max = 200) => {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return "";
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
};
