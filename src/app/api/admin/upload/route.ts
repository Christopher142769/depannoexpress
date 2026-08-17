import { z } from "zod";
import { getSupabaseAdmin } from "@/server/db/supabase";
import { requireRole, requireSession } from "@/server/auth/guards";
import { handleRouteError, jsonError, jsonOk } from "@/server/api/http";
import { USER_ROLES } from "@/lib/constants";

const BUCKETS = ["products", "trades", "avatars"] as const;
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export async function POST(req: Request) {
  try {
    const auth = await requireSession(req);
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]);
    if (forbidden) return forbidden;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = formData.get("bucket") as string | null;

    if (!file) return jsonError(400, "Aucun fichier fourni");
    if (!bucket || !BUCKETS.includes(bucket as never)) {
      return jsonError(400, `Bucket invalide. Valeurs autorisées : ${BUCKETS.join(", ")}`);
    }

    if (!ALLOWED_TYPES.includes(file.type as never)) {
      return jsonError(400, `Format non supporté. Types autorisés : ${ALLOWED_TYPES.join(", ")}`);
    }

    if (file.size > MAX_SIZE) {
      return jsonError(400, `Fichier trop volumineux (max ${MAX_SIZE / 1024 / 1024} Mo)`);
    }

    const supabase = getSupabaseAdmin();

    // Ensure bucket exists (create if not)
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === bucket);
    if (!bucketExists) {
      const { error: createErr } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: MAX_SIZE,
        allowedMimeTypes: [...ALLOWED_TYPES],
      });
      if (createErr && !createErr.message.includes("already exists")) {
        throw new Error(createErr.message);
      }
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const { error: uploadErr } = await supabase.storage
      .from(bucket)
      .upload(path, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) throw new Error(uploadErr.message);

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

    return jsonOk({ url: urlData.publicUrl });
  } catch (err) {
    return handleRouteError(err);
  }
}
