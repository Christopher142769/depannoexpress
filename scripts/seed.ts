/**
 * Seed de démonstration — npm run seed
 * Prérequis : MONGODB_URI dans .env.local
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
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI manquant");
  }

  const { connectDB } = await import("../src/server/db/mongodb");
  const {
    User,
    Product,
    Intervention,
    INTERVENTION_STATUS,
    Wallet,
  } = await import("../src/server/db/models");
  const { USER_ROLES, PRO_SPECIALTIES } = await import("../src/lib/constants");
  const { BOUTIQUE_PRODUCTS } = await import("../src/lib/boutique-products");

  await connectDB();
  console.log("→ Connexion Mongo OK");

  async function upsertUser(data: {
    email: string;
    name: string;
    phone: string;
    role: string;
    specialty?: string;
    isAvailable?: boolean;
    coordinates?: [number, number];
  }) {
    const update: Record<string, unknown> = {
      name: data.name,
      phone: data.phone,
      role: data.role,
      isVerified: true,
      specialty: data.specialty,
      isAvailable: data.isAvailable ?? false,
    };
    if (data.coordinates) {
      update.location = { type: "Point", coordinates: data.coordinates };
    }
    return User.findOneAndUpdate(
      { email: data.email },
      { $set: update },
      { upsert: true, new: true }
    );
  }

  const client = await upsertUser({
    email: "client.demo@depannage-express.bj",
    name: "Aïcha Demo",
    phone: "+22997001111",
    role: USER_ROLES.CLIENT,
  });

  const pro = await upsertUser({
    email: "pro.demo@depannage-express.bj",
    name: "Koffi Mécano",
    phone: "+22997002222",
    role: USER_ROLES.PRO,
    specialty: PRO_SPECIALTIES.MECHANIC,
    isAvailable: true,
    coordinates: [2.3912, 6.3703],
  });

  const admin = await upsertUser({
    email: "admin.demo@depannage-express.bj",
    name: "Admin Demo",
    phone: "+22997003333",
    role: USER_ROLES.ADMIN,
  });

  await Wallet.findOneAndUpdate(
    { userId: pro!._id },
    { $setOnInsert: { balance: 25000 } },
    { upsert: true, new: true }
  );

  const products = BOUTIQUE_PRODUCTS.map((p) => ({
    name: p.name,
    description: p.description,
    category: p.category,
    price: p.price,
    stock: p.stock,
    imageUrl: p.imageUrl,
  }));

  for (const p of products) {
    await Product.findOneAndUpdate(
      { name: p.name, vendorId: pro!._id },
      { $set: { ...p, vendorId: pro!._id, isActive: true } },
      { upsert: true, new: true }
    );
  }

  const existing = await Intervention.findOne({
    clientId: client!._id,
    problem: "Batterie à plat — seed demo",
  });
  if (!existing) {
    await Intervention.create({
      clientId: client!._id,
      proId: pro!._id,
      status: INTERVENTION_STATUS.COMPLETED,
      problem: "Batterie à plat — seed demo",
      clientLocation: {
        type: "Point",
        coordinates: [2.392, 6.371],
        address: "Cotonou, Akpakpa",
      },
      estimatedPrice: 10000,
      finalPrice: 10000,
      completedAt: new Date(),
    });
  }

  console.log("✓ Seed terminé");
  console.log("  client:", client!.email);
  console.log("  pro:   ", pro!.email);
  console.log("  admin: ", admin!.email);
  console.log(
    "Connexion via /login puis OTP (EMAIL_PROVIDER=console → code dans les logs)."
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed échoué:", err);
  process.exit(1);
});
