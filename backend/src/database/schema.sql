-- SPDX-License-Identifier: AGPL-3.0-or-later
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE IF NOT EXISTS municipalities (
  id uuid PRIMARY KEY, slug text UNIQUE NOT NULL, name text NOT NULL,
  timezone text NOT NULL, locale text NOT NULL DEFAULT 'gl',
  advance_days integer NOT NULL CHECK (advance_days BETWEEN 1 AND 90),
  cancellation_hours integer NOT NULL CHECK (cancellation_hours >= 0),
  max_active_bookings integer NOT NULL CHECK (max_active_bookings > 0),
  contact text NOT NULL, legal_text text NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES municipalities(id),
  display_name text NOT NULL, role text NOT NULL CHECK (role IN ('citizen', 'manager')),
  UNIQUE(tenant_id, id)
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY, tenant_id uuid NOT NULL, user_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id)
);
CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES municipalities(id),
  name text NOT NULL, sport text NOT NULL CHECK (sport IN ('padel','tennis','futsal','swimming')),
  address text NOT NULL, description text NOT NULL, accessible boolean NOT NULL,
  status text NOT NULL CHECK (status IN ('active','maintenance','closed')),
  slot_minutes integer NOT NULL CHECK (slot_minutes IN (30,60,90,120)),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  opening_calendar text NOT NULL, rules text NOT NULL,
  UNIQUE(tenant_id, id)
);
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, user_id uuid NOT NULL, facility_id uuid NOT NULL,
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('confirmed', 'cancelled')),
  created_at timestamptz NOT NULL, cancelled_at timestamptz,
  CHECK (ends_at > starts_at),
  CHECK ((status = 'confirmed' AND cancelled_at IS NULL) OR (status = 'cancelled' AND cancelled_at IS NOT NULL)),
  FOREIGN KEY (tenant_id, facility_id) REFERENCES facilities(tenant_id, id),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id),
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    tenant_id WITH =, facility_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status = 'confirmed'),
  UNIQUE(tenant_id, id)
);
CREATE INDEX IF NOT EXISTS bookings_user ON bookings(tenant_id, user_id, starts_at);
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, user_id uuid NOT NULL, booking_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('confirmed', 'rescheduled', 'cancelled')),
  created_at timestamptz NOT NULL,
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id),
  FOREIGN KEY (tenant_id, booking_id) REFERENCES bookings(tenant_id, id)
);
CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, actor_id uuid NOT NULL,
  action text NOT NULL, resource_id uuid NOT NULL, occurred_at timestamptz NOT NULL,
  FOREIGN KEY (tenant_id, actor_id) REFERENCES users(tenant_id, id)
);
