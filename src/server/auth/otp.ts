import { randomInt } from "crypto";
import { OTP_LENGTH } from "@/lib/constants";

export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH;
  return String(randomInt(0, max)).padStart(OTP_LENGTH, "0");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
