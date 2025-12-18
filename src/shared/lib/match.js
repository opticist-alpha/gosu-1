import { clamp } from "./utils";

export function scoreMatch({ pro, categoryId, query, region }) {
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

  score += clamp(pro.rating * 8, 0, 40);
  score += clamp(Math.log10((pro.reviewCount || 0) + 1) * 10, 0, 20);
  score += pro.verified ? 6 : 0;
  score += pro.responseRate ? clamp(pro.responseRate * 0.1, 0, 10) : 0;
  return score;
}
