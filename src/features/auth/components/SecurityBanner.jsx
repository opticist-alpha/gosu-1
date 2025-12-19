import React from "react";
import { useAuthEventStore } from "../../services/authEvents";

export default function SecurityBanner() {
  const { latest, clearLatest } = useAuthEventStore();

  if (!latest) return null;

  return (
    <div className="mb-6 flex items-start justify-between gap-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div>
        <p className="font-semibold">보안 알림</p>
        <p className="mt-1">{latest.message}</p>
        <p className="mt-1 text-xs text-amber-700">{latest.occurredAt}</p>
      </div>
      <button
        type="button"
        onClick={() => clearLatest()}
        className="rounded border border-amber-200 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
      >
        닫기
      </button>
    </div>
  );
}
