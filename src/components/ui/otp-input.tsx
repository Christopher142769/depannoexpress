"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { OTP_LENGTH } from "@/lib/constants";

export interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

/**
 * Saisie OTP — 6 cases individuelles
 * Tous les codes OTP sont envoyés par e-mail (jamais SMS)
 */
export function OTPInput({
  length = OTP_LENGTH,
  value,
  onChange,
  disabled = false,
  error,
  className,
}: OTPInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.padEnd(length, " ").split("").slice(0, length);

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const handleChange = (index: number, char: string) => {
    if (!/^\d?$/.test(char)) return;

    const arr = digits.map((d) => (d === " " ? "" : d));
    arr[index] = char;
    const newValue = arr.join("").trim();
    onChange(newValue);

    if (char && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !digits[index]?.trim() && index > 0) {
      focusInput(index - 1);
    }
    if (e.key === "ArrowLeft" && index > 0) focusInput(index - 1);
    if (e.key === "ArrowRight" && index < length - 1) focusInput(index + 1);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    focusInput(Math.min(pasted.length, length - 1));
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex gap-2 sm:gap-3" role="group" aria-label="Code de vérification">
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[i]?.trim() ?? ""}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            aria-label={`Chiffre ${i + 1} sur ${length}`}
            className={cn(
              "h-12 w-10 sm:h-14 sm:w-12 rounded-input border border-border bg-bg-elevated text-center text-lg font-bold text-text-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:border-brand-blue",
              "transition-all duration-200",
              error && "border-brand-red",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
        ))}
      </div>
      {error ? (
        <p className="text-xs text-brand-red text-center" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
