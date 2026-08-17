"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type AuthUnderlineFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const AuthUnderlineField = React.forwardRef<HTMLInputElement, AuthUnderlineFieldProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const fieldId = id ?? props.name;

    return (
      <div className="auth-field">
        <label htmlFor={fieldId} className="auth-field__label">
          {label}
        </label>
        <div className="auth-field__control">
          <input
            ref={ref}
            id={fieldId}
            className={cn("auth-field__input", error && "border-brand-red", className)}
            aria-invalid={!!error}
            {...props}
          />
          <span className="auth-field__line" aria-hidden="true" />
        </div>
        {error ? (
          <p className="auth-field__error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

AuthUnderlineField.displayName = "AuthUnderlineField";
