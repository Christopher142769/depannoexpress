import { z } from "zod";
import { ZodError } from "zod";
import { getSupabaseAdmin } from "@/server/db/supabase";
import { requireRole, requireSession } from "@/server/auth/guards";
import { fromZodError, handleRouteError, jsonError, jsonOk } from "@/server/api/http";
import { USER_ROLES } from "@/lib/constants";
import { sanitizeText } from "@/lib/sanitize";

const createSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  icon: z.string().max(50).optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  icon: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]);
    if (forbidden) return forbidden;

    const supabase = getSupabaseAdmin();
    const { data: trades, error } = await supabase
      .from("trades")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    return jsonOk({ trades: trades ?? [] });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]);
    if (forbidden) return forbidden;

    const body = createSchema.parse(await req.json());
    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from("trades")
      .select("id")
      .eq("slug", body.slug)
      .single();

    if (existing) return jsonError(409, "Un métier avec ce slug existe déjà");

    const { data: trade, error } = await supabase
      .from("trades")
      .insert({
        name: sanitizeText(body.name, 100),
        slug: body.slug,
        icon: body.icon ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return jsonOk({ trade }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]);
    if (forbidden) return forbidden;

    const body = updateSchema.parse(await req.json());
    const supabase = getSupabaseAdmin();

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = sanitizeText(body.name, 100);
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.icon !== undefined) updates.icon = body.icon;
    if (body.isActive !== undefined) updates.is_active = body.isActive;

    if (Object.keys(updates).length === 0) {
      return jsonError(400, "Aucune donnée à modifier");
    }

    const { data: trade, error } = await supabase
      .from("trades")
      .update(updates)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return jsonError(409, "Un métier avec ce slug existe déjà");
      throw new Error(error.message);
    }
    if (!trade) return jsonError(404, "Métier introuvable");

    return jsonOk({ trade });
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]);
    if (forbidden) return forbidden;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return jsonError(400, "id requis");

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("trades").delete().eq("id", id);
    if (error) throw new Error(error.message);

    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
