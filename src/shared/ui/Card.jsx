import React from "react";
import { cx } from "../lib/utils";

export function Card({ title, action, children, className }) {
  return (
    <section className={cx("rounded-lg border border-slate-200 bg-white p-4 shadow-sm", className)}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export default Card;
