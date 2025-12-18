import React from "react";
import { cx } from "../lib/utils";

export function Button({ as: Component = "button", children, variant = "primary", className, ...props }) {
  const base = "inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    ghost: "bg-transparent text-slate-900 hover:bg-slate-50 border border-slate-200",
  };

  return (
    <Component className={cx(base, variants[variant] ?? variants.primary, className)} {...props}>
      {children}
    </Component>
  );
}

export default Button;
