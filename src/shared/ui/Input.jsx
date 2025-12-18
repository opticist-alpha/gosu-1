import React from "react";
import { cx } from "../lib/utils";

export const Input = React.forwardRef(function Input({ label, helper, className, ...props }, ref) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      {label && <span className="font-medium text-slate-900">{label}</span>}
      <input
        ref={ref}
        className={cx(
          "rounded border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none",
          className
        )}
        {...props}
      />
      {helper && <span className="text-xs text-slate-500">{helper}</span>}
    </label>
  );
});

export default Input;
