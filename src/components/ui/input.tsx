import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

/** Champ de saisie — radius 14px */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-input border border-border bg-bg-elevated px-4 py-2 text-sm text-text-primary placeholder:text-text-secondary transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:border-brand-blue",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-brand-red focus-visible:ring-brand-red",
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-xs text-brand-red" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
