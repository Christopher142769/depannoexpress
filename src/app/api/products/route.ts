import { z } from "zod";
import { ZodError } from "zod";
import { getSupabaseAdmin } from "@/server/db/supabase";
import { requireSession } from "@/server/auth/guards";
import { fromZodError, handleRouteError, jsonOk } from "@/server/api/http";

const querySchema = z.object({
  category: z.enum(["pneu", "piece", "accessoire"]).optional(),
  q: z.string().max(100).optional(),
});

export async function GET(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(req.url);
    const q = querySchema.parse({
      category: searchParams.get("category") ?? undefined,
      q: searchParams.get("q") ?? undefined,
    });

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("products")
      .select("id, name, description, category, price, stock, image_url")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100);

    if (q.category) {
      query = query.eq("category", q.category);
    }
    if (q.q) {
      query = query.or(`name.ilike.%${q.q}%,description.ilike.%${q.q}%`);
    }

    const { data: products } = await query;

    return jsonOk({
      products: (products ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price,
        stock: p.stock,
        imageUrl: p.image_url,
      })),
    });
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}
