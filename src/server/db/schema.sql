-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'pro', 'admin', 'super_admin')),
  specialty TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT false,
  location GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role_available ON users(role, is_available);
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST(location);

CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
-- TTL-like cleanup: delete expired OTPs periodically via pg_cron or app logic

CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pro_id UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'en_route', 'in_progress', 'completed', 'cancelled')),
  problem TEXT NOT NULL,
  client_location GEOGRAPHY(POINT, 4326) NOT NULL,
  client_address TEXT,
  pro_location GEOGRAPHY(POINT, 4326),
  estimated_price NUMERIC,
  final_price NUMERIC,
  cancellation_penalty NUMERIC DEFAULT 0,
  cancelled_by TEXT CHECK (cancelled_by IN ('client', 'pro', 'admin')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interventions_client ON interventions(client_id);
CREATE INDEX IF NOT EXISTS idx_interventions_pro ON interventions(pro_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status_created ON interventions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interventions_client_location ON interventions USING GIST(client_location);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervention_id UUID NOT NULL UNIQUE REFERENCES interventions(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT CHECK (char_length(comment) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_pro ON reviews(pro_id, rating DESC);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('pneu', 'piece', 'accessoire')),
  price NUMERIC NOT NULL CHECK (price >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category, is_active);

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'commission', 'penalty', 'payout')),
  amount NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  description TEXT NOT NULL,
  intervention_id UUID REFERENCES interventions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created ON wallet_transactions(user_id, created_at DESC);

-- ============================================================
-- TRADES (métiers dynamiques)
-- ============================================================

CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tr_trades_updated_at BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed initial trades
INSERT INTO trades (name, slug, icon) VALUES
  ('Mécanicien', 'mecanicien', 'Wrench'),
  ('Vulcanisateur', 'vulcanisateur', 'Circle'),
  ('Électricien auto', 'electricien', 'Zap')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PRICING RULES (tarification admin)
-- ============================================================

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

CREATE UNIQUE INDEX idx_pricing_rules_trade_active ON pricing_rules(trade_id) WHERE is_active = true;
CREATE TRIGGER tr_pricing_rules_updated_at BEFORE UPDATE ON pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_interventions_updated_at BEFORE UPDATE ON interventions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RPC: Find nearby pros using PostGIS
CREATE OR REPLACE FUNCTION find_nearby_pros(
  lng DOUBLE PRECISION,
  lat DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION DEFAULT 15000,
  spec TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  specialty TEXT,
  is_available BOOLEAN,
  lng_out DOUBLE PRECISION,
  lat_out DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.phone,
    u.specialty,
    u.is_available,
    ST_X(u.location::geometry) AS lng_out,
    ST_Y(u.location::geometry) AS lat_out,
    ST_Distance(u.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) AS distance_meters
  FROM users u
  WHERE u.role = 'pro'
    AND u.is_available = true
    AND u.location IS NOT NULL
    AND ST_DWithin(u.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_meters)
    AND (spec IS NULL OR u.specialty = spec)
  ORDER BY u.location <-> ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- RPC: Find nearby pending interventions for pros
CREATE OR REPLACE FUNCTION find_nearby_missions(
  lng DOUBLE PRECISION,
  lat DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION DEFAULT 15000
)
RETURNS TABLE (
  id UUID,
  client_id UUID,
  status TEXT,
  problem TEXT,
  client_lng DOUBLE PRECISION,
  client_lat DOUBLE PRECISION,
  client_address TEXT,
  estimated_price NUMERIC,
  created_at TIMESTAMPTZ,
  client_name TEXT,
  client_phone TEXT,
  distance_meters DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.client_id,
    i.status,
    i.problem,
    ST_X(i.client_location::geometry) AS client_lng,
    ST_Y(i.client_location::geometry) AS client_lat,
    i.client_address,
    i.estimated_price,
    i.created_at,
    u.name AS client_name,
    u.phone AS client_phone,
    ST_Distance(i.client_location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) AS distance_meters
  FROM interventions i
  JOIN users u ON u.id = i.client_id
  WHERE i.status = 'pending'
    AND ST_DWithin(i.client_location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_meters)
  ORDER BY i.client_location <-> ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  LIMIT 30;
END;
$$ LANGUAGE plpgsql;

-- RPC: Clean expired OTPs
CREATE OR REPLACE FUNCTION clean_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otps WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
