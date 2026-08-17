import { getSupabaseAdmin } from "@/server/db/supabase";
import { handleRouteError, jsonOk } from "@/server/api/http";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data: trades, error } = await supabase
      .from("trades")
      .select("id, name, slug, icon")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    return jsonOk({ trades: trades ?? [] });
  } catch (err) {
    return handleRouteError(err);
  }
}
