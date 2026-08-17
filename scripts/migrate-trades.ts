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

async function migrate() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials");

  const sql = `
    CREATE TABLE IF NOT EXISTS trades (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TRIGGER IF NOT EXISTS tr_trades_updated_at BEFORE UPDATE ON trades
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();

    INSERT INTO trades (name, slug, icon) VALUES
      ('Mécanicien', 'mecanicien', 'Wrench'),
      ('Vulcanisateur', 'vulcanisateur', 'Circle'),
      ('Électricien auto', 'electricien', 'Zap')
    ON CONFLICT (slug) DO NOTHING;

    CREATE TABLE IF NOT EXISTS pricing_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
      base_price NUMERIC NOT NULL CHECK (base_price > 0),
      price_per_km NUMERIC DEFAULT 0 CHECK (price_per_km >= 0),
      currency TEXT NOT NULL DEFAULT 'XOF',
      is_active BOOLEAN NOT NULL DEFAULT true,
      updated_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_pricing_rules_trade_active ON pricing_rules(trade_id) WHERE is_active = true;

    CREATE TRIGGER IF NOT EXISTS tr_pricing_rules_updated_at BEFORE UPDATE ON pricing_rules
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `;

  // Use Supabase SQL API via REST (PostgREST doesn't support DDL, but the management API does)
  // Actually, we use the project's SQL endpoint
  const projectId = url.replace("https://", "").replace(".supabase.co", "");
  const sqlUrl = `https://api.supabase.com/v1/projects/${projectId}/database/query`;

  console.log("→ Executing migration via Supabase SQL API...");
  const res = await fetch(sqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("SQL API failed:", res.status, body);
    console.log("→ Falling back to Supabase JS client + rpc approach...");

    // Fallback: use the Supabase client to create tables via individual statements
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key);

    // Execute each statement individually using the Supabase SQL endpoint
    const statements = sql.split(";").filter((s) => s.trim());
    for (const stmt of statements) {
      if (!stmt.trim()) continue;
      const r = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ query: stmt.trim() }),
      });
      if (!r.ok) {
        console.warn("Statement may have failed:", stmt.trim().slice(0, 80));
      }
    }
    console.log("✓ Migration attempted (check Supabase dashboard for status)");
  } else {
    console.log("✓ Migration complete: trades + pricing_rules tables created.");
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
