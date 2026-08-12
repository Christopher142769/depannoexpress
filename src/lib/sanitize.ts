/** Nettoyage basique des champs texte libres (XSS / injections triviales) */
export function sanitizeText(input: string, maxLength = 2000): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[<>]/g, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/&lt;|&gt;/gi, "")
    .trim()
    .slice(0, maxLength);
}

/** Sanitize optionnel (undefined → undefined) */
export function sanitizeOptional(
  input: string | undefined | null,
  maxLength = 2000
): string | undefined {
  if (input == null) return undefined;
  const cleaned = sanitizeText(input, maxLength);
  return cleaned.length > 0 ? cleaned : undefined;
}
