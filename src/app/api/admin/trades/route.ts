import { z } from "zod";
import { ZodError } from "zod";
import { getSupabaseAdmin } from "@/server/db/supabase";
import { requireRole, requireSession } from "@/server/auth/guards";
import { fromZodError, handleRouteError, jsonError, jsonOk } from "@/server/api/http";
import { USER_ROLES } from "@/lib/constants";
import { sanitizeText } from "@/lib/sanitize";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const createSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  icon: z.string().max(50).optional(),
  imageUrl: z.string().url().max(500).optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  icon: z.string().max(50).optional(),
  imageUrl: z.string().url().max(500).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]);
    if (forbidden) return forbidden;

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("all") === "1";

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("trades")
      .select("*")
      .order("created_at", { ascending: true });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data: trades, error } = await query;
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
    const slug = body.slug ?? slugify(body.name);
    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from("trades")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) return jsonError(409, "Un métier avec ce slug existe déjà");

    const { data: trade, error } = await supabase
      .from("trades")
      .insert({
        name: sanitizeText(body.name, 100),
        slug,
        icon: body.icon ?? null,
        image_url: body.imageUrl ?? null,
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
    if (body.imageUrl !== undefined) updates.image_url = body.imageUrl;
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

    // Check if active pros use this trade
    const { count } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("specialty", (await supabase.from("trades").select("slug").eq("id", id).single()).data?.slug)
      .eq("role", "pro")
      .eq("is_available", true);

    if (count && count > 0) {
      return jsonError(
        409,
        `${count} dépanneur(s) actif(s) utilisent ce métier. Désactivez-les ou réaffectez-les avant.`
      );
    }

    // Soft delete
    const { error } = await supabase
      .from("trades")
      .update({ is_active: false })
      .eq("id", id);
    if (error) throw new Error(error.message);

    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
