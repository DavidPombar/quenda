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
-- Email notices (C4): optional contact data, per-municipality sender and reminder lead time.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locale text CHECK (locale IN ('gl', 'es'));
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS reminder_hours integer NOT NULL DEFAULT 24
  CHECK (reminder_hours BETWEEN 1 AND 168);
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS mail_sender_name text NOT NULL DEFAULT '';
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS mail_reply_to text NOT NULL DEFAULT '';
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_kind_check
  CHECK (kind IN ('confirmed', 'rescheduled', 'cancelled', 'reminder'));
-- A missing row means the default: every notice is enabled.
CREATE TABLE IF NOT EXISTS notification_preferences (
  tenant_id uuid NOT NULL, user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('reminder')),
  channel text NOT NULL CHECK (channel IN ('email')),
  enabled boolean NOT NULL, updated_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, user_id, kind, channel),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id)
);
-- Transactional outbox: rows commit with the booking change; a worker delivers them afterwards.
-- Recipient and text are resolved at delivery time, so no copy of personal data is kept here.
CREATE TABLE IF NOT EXISTS outbox (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, user_id uuid NOT NULL, booking_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('confirmed', 'rescheduled', 'cancelled', 'reminder')),
  channel text NOT NULL CHECK (channel IN ('email')),
  dedupe_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL, available_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0, locked_until timestamptz,
  sent_at timestamptz, last_error text,
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id),
  FOREIGN KEY (tenant_id, booking_id) REFERENCES bookings(tenant_id, id)
);
CREATE INDEX IF NOT EXISTS outbox_pending ON outbox(available_at) WHERE sent_at IS NULL;
