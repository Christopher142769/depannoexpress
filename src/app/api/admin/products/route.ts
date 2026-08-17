import { z } from "zod";
import { ZodError } from "zod";
import { getSupabaseAdmin } from "@/server/db/supabase";
import { requireRole, requireSession } from "@/server/auth/guards";
import { fromZodError, handleRouteError, jsonError, jsonOk } from "@/server/api/http";
import { USER_ROLES } from "@/lib/constants";
import { sanitizeText } from "@/lib/sanitize";

const CATEGORIES = ["pneu", "piece", "accessoire"] as const;

const createSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(5).max(2000),
  category: z.enum(CATEGORIES),
  price: z.number().min(0).max(50_000_000),
  stock: z.number().int().min(0).max(100_000),
  imageUrl: z.string().url().max(500).optional(),
  vendorId: z.string().uuid().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(200).optional(),
  description: z.string().min(5).max(2000).optional(),
  category: z.enum(CATEGORIES).optional(),
  price: z.number().min(0).max(50_000_000).optional(),
  stock: z.number().int().min(0).max(100_000).optional(),
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
    const category = searchParams.get("category");
    const q = searchParams.get("q");

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("products")
      .select("*, vendor:users!products_vendor_id_fkey(id, name)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }
    if (category && CATEGORIES.includes(category as never)) {
      query = query.eq("category", category);
    }
    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data: products, error } = await query;
    if (error) throw new Error(error.message);

    return jsonOk({
      products: (products ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price,
        stock: p.stock,
        imageUrl: p.image_url,
        isActive: p.is_active,
        vendor: p.vendor,
        createdAt: p.created_at,
      })),
    });
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

    // Use provided vendorId or default to the first pro user (admin-created products)
    let vendorId = body.vendorId;
    if (!vendorId) {
      const { data: fallbackVendor } = await supabase
        .from("users")
        .select("id")
        .eq("role", "pro")
        .limit(1)
        .single();
      if (!fallbackVendor) return jsonError(400, "Aucun vendeur disponible. Spécifiez un vendorId.");
      vendorId = fallbackVendor.id;
    }

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        vendor_id: vendorId,
        name: sanitizeText(body.name, 200),
        description: sanitizeText(body.description, 2000),
        category: body.category,
        price: body.price,
        stock: body.stock,
        image_url: body.imageUrl ?? null,
        is_active: true,
      })
      .select("*, vendor:users!products_vendor_id_fkey(id, name)")
      .single();

    if (error) throw new Error(error.message);

    return jsonOk({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        stock: product.stock,
        imageUrl: product.image_url,
        isActive: product.is_active,
        vendor: product.vendor,
        createdAt: product.created_at,
      },
    }, { status: 201 });
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
    if (body.name !== undefined) updates.name = sanitizeText(body.name, 200);
    if (body.description !== undefined) updates.description = sanitizeText(body.description, 2000);
    if (body.category !== undefined) updates.category = body.category;
    if (body.price !== undefined) updates.price = body.price;
    if (body.stock !== undefined) updates.stock = body.stock;
    if (body.imageUrl !== undefined) updates.image_url = body.imageUrl;
    if (body.isActive !== undefined) updates.is_active = body.isActive;

    if (Object.keys(updates).length === 0) {
      return jsonError(400, "Aucune donnée à modifier");
    }

    const { data: product, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", body.id)
      .select("*, vendor:users!products_vendor_id_fkey(id, name)")
      .single();

    if (error) throw new Error(error.message);
    if (!product) return jsonError(404, "Article introuvable");

    return jsonOk({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        stock: product.stock,
        imageUrl: product.image_url,
        isActive: product.is_active,
        vendor: product.vendor,
        createdAt: product.created_at,
      },
    });
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
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", id);
    if (error) throw new Error(error.message);

    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
