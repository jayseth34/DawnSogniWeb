-- Dawn Sogni schema (Postgres)
-- Run with:
-- psql -h localhost -p 5432 -U postgres -d rapido_delivery -f apps/api/schema.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drops
CREATE TABLE IF NOT EXISTS drop_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  category text,
  images text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Custom requests
CREATE TABLE IF NOT EXISTS custom_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  notes text,
  reference_images text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'REQUESTED',
  approx_price_low integer NOT NULL DEFAULT 60000,
  approx_price_high integer NOT NULL DEFAULT 80000,
  quoted_price_cents integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_request_id uuid NOT NULL REFERENCES custom_requests(id) ON DELETE CASCADE,
  images text[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  access_token text NOT NULL UNIQUE,
  order_type text NOT NULL,
  status text NOT NULL DEFAULT 'PLACED',
  payment_method text NOT NULL DEFAULT 'COD',

  customer_name text NOT NULL,
  phone text NOT NULL,
  email text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,

  subtotal_cents integer NOT NULL CHECK (subtotal_cents >= 0),
  shipping_cents integer NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0),
  total_cents integer NOT NULL CHECK (total_cents >= 0),

  partial_amount_cents integer,
  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity >= 1),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  title text NOT NULL,
  variant text,
  size text,
  image_url text,
  drop_design_id uuid REFERENCES drop_designs(id),
  custom_request_id uuid REFERENCES custom_requests(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS owner_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  channel text NOT NULL,
  to_address text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'QUEUED',
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  error text
);

-- Updated-at triggers
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_drop_designs_updated_at') THEN
    CREATE TRIGGER trg_drop_designs_updated_at BEFORE UPDATE ON drop_designs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_custom_requests_updated_at') THEN
    CREATE TRIGGER trg_custom_requests_updated_at BEFORE UPDATE ON custom_requests
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_orders_updated_at') THEN
    CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_designs_request_id ON custom_designs(custom_request_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_owner_notifications_order_id ON owner_notifications(order_id);

COMMIT;
