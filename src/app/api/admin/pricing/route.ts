import { z } from "zod";
import { ZodError } from "zod";
import { getSupabaseAdmin } from "@/server/db/supabase";
import { requireRole, requireSession } from "@/server/auth/guards";
import { fromZodError, handleRouteError, jsonError, jsonOk } from "@/server/api/http";
import { USER_ROLES } from "@/lib/constants";

const upsertSchema = z.object({
  tradeId: z.string().uuid(),
  basePrice: z.number().min(1).max(5_000_000),
  pricePerKm: z.number().min(0).max(100_000).optional(),
});

export async function GET(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]);
    if (forbidden) return forbidden;

    const supabase = getSupabaseAdmin();
    const { data: rules, error } = await supabase
      .from("pricing_rules")
      .select("*, trade:trades(id, name, slug)")
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    return jsonOk({ rules: rules ?? [] });
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

    const body = upsertSchema.parse(await req.json());
    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from("pricing_rules")
      .select("id")
      .eq("trade_id", body.tradeId)
      .eq("is_active", true)
      .single();

    let rule;

    if (existing) {
      const { data, error } = await supabase
        .from("pricing_rules")
        .update({
          base_price: body.basePrice,
          price_per_km: body.pricePerKm ?? 0,
          updated_by: auth.user.id,
        })
        .eq("id", existing.id)
        .select("*, trade:trades(id, name, slug)")
        .single();

      if (error) throw new Error(error.message);
      rule = data;
    } else {
      const { data, error } = await supabase
        .from("pricing_rules")
        .insert({
          trade_id: body.tradeId,
          base_price: body.basePrice,
          price_per_km: body.pricePerKm ?? 0,
          updated_by: auth.user.id,
        })
        .select("*, trade:trades(id, name, slug)")
        .single();

      if (error) throw new Error(error.message);
      rule = data;
    }

    return jsonOk({ rule }, { status: existing ? 200 : 201 });
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
    const { error } = await supabase.from("pricing_rules").delete().eq("id", id);
    if (error) throw new Error(error.message);

    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
