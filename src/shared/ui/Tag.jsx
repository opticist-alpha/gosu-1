import React from "react";
import { cx } from "../lib/utils";

export function Tag({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
  };
  return <span className={cx("inline-flex rounded-full px-2 py-1 text-xs font-medium", tones[tone])}>{children}</span>;
}

export default Tag;
