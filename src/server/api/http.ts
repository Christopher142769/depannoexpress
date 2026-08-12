import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Forme d’erreur API uniforme sur toute la plateforme */
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
      err.message.includes("MONGODB_URI") ||
      err.message.includes("Mongo") ||
      err.name === "MongoServerError" ||
      err.name === "MongooseError"
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

/** Enveloppe une route API : catch systématique + réponses homogènes */
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
