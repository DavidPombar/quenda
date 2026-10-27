-- SPDX-License-Identifier: AGPL-3.0-or-later
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE IF NOT EXISTS municipalities (
  id uuid PRIMARY KEY, slug text UNIQUE NOT NULL, name text NOT NULL,
  timezone text NOT NULL, locale text NOT NULL DEFAULT 'gl',
  advance_days integer NOT NULL CHECK (advance_days BETWEEN 1 AND 90),
  cancellation_hours integer NOT NULL CHECK (cancellation_hours >= 0),
  max_active_bookings integer NOT NULL CHECK (max_active_bookings > 0),
  contact text NOT NULL, legal_text text NOT NULL,
  legal_version text NOT NULL DEFAULT '2026-10',
  retention_months integer NOT NULL DEFAULT 24 CHECK (retention_months BETWEEN 1 AND 120)
);
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES municipalities(id),
  display_name text NOT NULL, role text NOT NULL CHECK (role IN ('citizen', 'manager')),
  deleted_at timestamptz,
  UNIQUE(tenant_id, id)
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY, tenant_id uuid NOT NULL, user_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id)
);
-- Append-only record of accepted privacy notice versions; kept until retention purges the user.
CREATE TABLE IF NOT EXISTS consents (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, user_id uuid NOT NULL,
  legal_version text NOT NULL, accepted_at timestamptz NOT NULL,
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id)
);
CREATE INDEX IF NOT EXISTS consents_user ON consents(tenant_id, user_id, accepted_at DESC);
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
-- user_id becomes NULL when retention detaches a past reservation from its person.
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, user_id uuid, facility_id uuid NOT NULL,
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
-- actor_id is NULL for system actions and after retention pseudonymises old events.
CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, actor_id uuid,
  action text NOT NULL, resource_id uuid NOT NULL, occurred_at timestamptz NOT NULL,
  actor_role text, details jsonb,
  FOREIGN KEY (tenant_id, actor_id) REFERENCES users(tenant_id, id)
);
CREATE INDEX IF NOT EXISTS audit_events_tenant_time ON audit_events(tenant_id, occurred_at DESC);
-- Idempotent upgrades for databases created before these columns existed.
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS legal_version text NOT NULL DEFAULT '2026-10';
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS retention_months integer NOT NULL DEFAULT 24
  CHECK (retention_months BETWEEN 1 AND 120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE bookings ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE audit_events ALTER COLUMN actor_id DROP NOT NULL;
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS actor_role text;
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS details jsonb;
-- Municipal settings editable by managers (R2, M2).
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS primary_color text NOT NULL DEFAULT '#1f5b43'
  CHECK (primary_color ~ '^#[0-9a-f]{6}$');
-- RFC 5545 VCALENDAR of all-day closures inherited by every facility; empty means none.
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS holidays_calendar text NOT NULL DEFAULT '';
-- Append-only privacy notice versions; consents.legal_version points here so the accepted text can be proven.
CREATE TABLE IF NOT EXISTS legal_texts (
  tenant_id uuid NOT NULL REFERENCES municipalities(id), version text NOT NULL,
  text_gl text NOT NULL, text_es text NOT NULL, published_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, version)
);
INSERT INTO legal_texts (tenant_id, version, text_gl, text_es, published_at)
  SELECT id, legal_version, legal_text, legal_text, now() FROM municipalities
  ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS municipality_logos (
  tenant_id uuid PRIMARY KEY REFERENCES municipalities(id),
  content_type text NOT NULL CHECK (content_type IN ('image/png', 'image/jpeg', 'image/webp')),
  data bytea NOT NULL CHECK (octet_length(data) BETWEEN 1 AND 2097152),
  sha256 text NOT NULL, updated_at timestamptz NOT NULL
);
-- Cancellation deadline in force when the booking was made; NULL for older rows (current setting applies).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_hours integer CHECK (cancellation_hours >= 0);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS follows_municipal_holidays boolean NOT NULL DEFAULT true;
-- User categories and per-category tariffs (M2, R2). The facility price_cents is the general
-- tariff; categories only apply once a manager verifies them.
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS enabled_categories text[] NOT NULL DEFAULT '{}'
  CHECK (enabled_categories <@ ARRAY['resident','family','local_club','minor','large_family','disability','senior']);
CREATE TABLE IF NOT EXISTS facility_prices (
  tenant_id uuid NOT NULL, facility_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('resident','family','local_club','minor','large_family','disability','senior')),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  PRIMARY KEY (tenant_id, facility_id, category),
  FOREIGN KEY (tenant_id, facility_id) REFERENCES facilities(tenant_id, id)
);
-- Only the category and its state are kept; supporting documents are checked outside the platform.
-- Rows are deleted with the account (they can reveal special-category data), so retention never meets them.
CREATE TABLE IF NOT EXISTS user_categories (
  tenant_id uuid NOT NULL, user_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('resident','family','local_club','minor','large_family','disability','senior')),
  status text NOT NULL CHECK (status IN ('requested','verified','rejected')),
  requested_at timestamptz, decided_at timestamptz,
  PRIMARY KEY (tenant_id, user_id, category),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id)
);
CREATE INDEX IF NOT EXISTS user_categories_pending ON user_categories(tenant_id, requested_at) WHERE status='requested';
ALTER TABLE users ADD COLUMN IF NOT EXISTS prefers_family_tariff boolean NOT NULL DEFAULT false;
-- Tariff in force when the booking was made or last rescheduled; NULL for older rows.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tariff_category text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price_cents integer CHECK (price_cents >= 0);
