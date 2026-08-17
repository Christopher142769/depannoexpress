/**
 * Seed de démonstration — npm run seed
 * Prérequis : SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans .env.local
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvFile(file: string) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i);
    const value = trimmed.slice(i + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY manquants");
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { hashPassword } = await import("../src/server/auth/password");
  const { DEMO_PASSWORD } = await import("../src/lib/demo-accounts");

  console.log("→ Connexion Supabase OK");

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // Upsert helper
  async function upsertUser(data: {
    email: string;
    name: string;
    phone: string;
    role: string;
    specialty?: string;
    isAvailable?: boolean;
    coordinates?: [number, number];
  }) {
    const row: Record<string, unknown> = {
      email: data.email,
      name: data.name,
      phone: data.phone,
      role: data.role,
      is_verified: true,
      password_hash: passwordHash,
      specialty: data.specialty ?? null,
      is_available: data.isAvailable ?? false,
    };
    if (data.coordinates) {
      row.location = `POINT(${data.coordinates[0]} ${data.coordinates[1]})`;
    }
    const { data: result } = await supabase
      .from("users")
      .upsert(row, { onConflict: "email" })
      .select("id, email")
      .single();
    return result;
  }

  const client = await upsertUser({
    email: "client.demo@depannage-express.bj",
    name: "Aïcha Demo",
    phone: "+22997001111",
    role: "client",
  });

  const pro = await upsertUser({
    email: "pro.demo@depannage-express.bj",
    name: "Koffi Mécano",
    phone: "+22997002222",
    role: "pro",
    specialty: "mecanicien",
    isAvailable: true,
    coordinates: [2.3912, 6.3703],
  });

  const admin = await upsertUser({
    email: "admin.demo@depannage-express.bj",
    name: "Admin Demo",
    phone: "+22997003333",
    role: "admin",
  });

  // Wallet for pro
  await supabase
    .from("wallets")
    .upsert({ user_id: pro!.id, balance: 25000 }, { onConflict: "user_id" });

  // Products
  const { BOUTIQUE_PRODUCTS } = await import("../src/lib/boutique-products");
  for (const p of BOUTIQUE_PRODUCTS) {
    await supabase.from("products").upsert(
      {
        vendor_id: pro!.id,
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price,
        stock: p.stock,
        image_url: p.imageUrl,
        is_active: true,
      },
      { onConflict: "name,vendor_id" }
    );
  }

  // Interventions
  const { data: existingCompleted } = await supabase
    .from("interventions")
    .select("id")
    .eq("client_id", client!.id)
    .eq("problem", "Batterie à plat, seed demo")
    .limit(1)
    .single();

  if (!existingCompleted) {
    await supabase.from("interventions").insert({
      client_id: client!.id,
      pro_id: pro!.id,
      status: "completed",
      problem: "Batterie à plat, seed demo",
      client_location: `POINT(2.392 6.371)`,
      client_address: "Cotonou, Akpakpa",
      estimated_price: 10000,
      final_price: 10000,
      completed_at: new Date().toISOString(),
    });
  }

  const { data: existingPending } = await supabase
    .from("interventions")
    .select("id")
    .eq("client_id", client!.id)
    .eq("problem", "Pneu crevé — démo en attente")
    .eq("status", "pending")
    .limit(1)
    .single();

  if (!existingPending) {
    await supabase.from("interventions").insert({
      client_id: client!.id,
      status: "pending",
      problem: "Pneu crevé — démo en attente",
      client_location: `POINT(2.3885 6.365)`,
      client_address: "Cotonou, Fidjrossè",
      estimated_price: 8000,
    });
  }

  console.log("✓ Seed terminé");
  console.log("");
  console.log(`  Mot de passe démo (tous) : ${DEMO_PASSWORD}`);
  console.log("  · Utilisateur :", client!.email, "→ /login → /app");
  console.log("  · Dépanneur  :", pro!.email, "→ /pro/login → /pro");
  console.log("  · Admin      :", admin!.email, "→ /admin/login → /admin");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed échoué:", err);
  process.exit(1);
});
