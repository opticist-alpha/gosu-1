export function formatKRW(value) {
  if (value == null || Number.isNaN(Number(value))) return "-";
  const numeric = Math.round(Number(value));
  return `${numeric.toLocaleString("ko-KR")}원`;
}

export function formatDateTime(ts) {
  const date = ts ? new Date(ts) : new Date();
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
