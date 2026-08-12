import { z } from "zod";
import { ZodError } from "zod";
import { connectDB } from "@/server/db/mongodb";
import { Product } from "@/server/db/models";
import { requireSession } from "@/server/auth/guards";
import { fromZodError, handleRouteError, jsonOk } from "@/server/api/http";

const querySchema = z.object({
  category: z.enum(["pneu", "piece", "accessoire"]).optional(),
  q: z.string().max(100).optional(),
});

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(req.url);
    const q = querySchema.parse({
      category: searchParams.get("category") ?? undefined,
      q: searchParams.get("q") ?? undefined,
    });

    await connectDB();
    const filter: Record<string, unknown> = { isActive: true };
    if (q.category) filter.category = q.category;
    if (q.q) {
      filter.$or = [
        { name: { $regex: q.q, $options: "i" } },
        { description: { $regex: q.q, $options: "i" } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 }).limit(100).lean();

    return jsonOk({
      products: products.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price,
        stock: p.stock,
        imageUrl: p.imageUrl,
      })),
    });
  } catch (err) {
    if (err instanceof ZodError) return fromZodError(err);
    return handleRouteError(err);
  }
}
