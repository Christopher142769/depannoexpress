import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorBody = {
  error: string;
  code?: string;
  details?: unknown;
};

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: init?.status ?? 200, headers: init?.headers });
}

export function jsonError(
  status: number,
  error: string,
  details?: unknown,
  code?: string
) {
  const body: ApiErrorBody = { error };
  if (code) body.code = code;
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status });
}

export function fromZodError(err: ZodError) {
  return jsonError(400, "Données invalides", err.flatten(), "VALIDATION_ERROR");
}

export function handleRouteError(err: unknown) {
  if (err instanceof ZodError) return fromZodError(err);

  if (err instanceof Error) {
    if (
      err.message.includes("Supabase") ||
      err.message.includes("JWT") ||
      err.name === "PostgrestError"
    ) {
      console.error("[api:db]", err.message);
      return jsonError(503, "Service de données indisponible", undefined, "DB_UNAVAILABLE");
    }
  }

  console.error("[api]", err);
  const message =
    err instanceof Error && process.env.NODE_ENV === "development"
      ? err.message
      : "Erreur serveur";
  return jsonError(500, message, undefined, "INTERNAL_ERROR");
}

export function apiHandler(
  handler: (req: Request, ctx?: unknown) => Promise<Response>
) {
  return async (req: Request, ctx?: unknown) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      return handleRouteError(err);
    }
  };
}
