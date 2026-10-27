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
-- Attendance, no-shows and municipal cancellations (C3, M3). Attended is derived: a confirmed
-- booking that has ended. Constraints are recreated by name so the upgrade stays idempotent.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_check1;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_valid;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_valid
  CHECK (status IN ('confirmed', 'cancelled', 'no_show'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by text CHECK (cancelled_by IN ('citizen', 'municipality'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason text CHECK (length(cancellation_reason) <= 500);
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_cancellation_valid;
ALTER TABLE bookings ADD CONSTRAINT bookings_cancellation_valid CHECK (
  (status IN ('confirmed', 'no_show') AND cancelled_at IS NULL AND cancelled_by IS NULL AND cancellation_reason IS NULL)
  OR (status = 'cancelled' AND cancelled_at IS NOT NULL
    AND (cancelled_by IS DISTINCT FROM 'municipality' OR cancellation_reason IS NOT NULL))
);
-- No-show penalty: no_show_limit absences within no_show_window_days block new bookings for
-- no_show_block_days. A limit of 0 disables it.
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS no_show_limit integer NOT NULL DEFAULT 3
  CHECK (no_show_limit BETWEEN 0 AND 20);
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS no_show_window_days integer NOT NULL DEFAULT 30
  CHECK (no_show_window_days BETWEEN 1 AND 365);
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS no_show_block_days integer NOT NULL DEFAULT 7
  CHECK (no_show_block_days BETWEEN 1 AND 365);
-- booking_id is the no-show that reached the limit; lifted_at is set when it is corrected.
CREATE TABLE IF NOT EXISTS booking_blocks (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, user_id uuid NOT NULL, booking_id uuid NOT NULL,
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, lifted_at timestamptz,
  CHECK (ends_at > starts_at),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id),
  FOREIGN KEY (tenant_id, booking_id) REFERENCES bookings(tenant_id, id)
);
CREATE INDEX IF NOT EXISTS booking_blocks_user ON booking_blocks(tenant_id, user_id, ends_at);
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_kind_check CHECK (kind IN (
  'confirmed', 'rescheduled', 'cancelled', 'cancelled_by_municipality', 'no_show', 'blocked', 'unblocked'
));
-- Snapshot shown with the notice: the municipal reason or the penalty standing at that moment.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS details jsonb;
-- Access control (M3, #23). 'staff' only validates credentials and marks attendance.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_valid;
ALTER TABLE users ADD CONSTRAINT users_role_valid CHECK (role IN ('citizen', 'manager', 'staff'));
-- Ed25519 key per municipality; the private half is AES-256-GCM encrypted under the deployment
-- key (iv | tag | ciphertext). Rotation retires the active key, which revokes its credentials.
CREATE TABLE IF NOT EXISTS municipality_signing_keys (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES municipalities(id),
  public_key text NOT NULL, encrypted_private_key bytea NOT NULL,
  created_at timestamptz NOT NULL, retired_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS municipality_signing_keys_active
  ON municipality_signing_keys(tenant_id) WHERE retired_at IS NULL;
-- Scanned at the door; a check-in only stands on a confirmed booking.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_in_by uuid;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_checked_in_by_fk;
ALTER TABLE bookings ADD CONSTRAINT bookings_checked_in_by_fk
  FOREIGN KEY (tenant_id, checked_in_by) REFERENCES users(tenant_id, id);
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_check_in_valid;
ALTER TABLE bookings ADD CONSTRAINT bookings_check_in_valid CHECK (
  (checked_in_at IS NULL AND checked_in_by IS NULL)
  OR (status = 'confirmed' AND checked_in_at IS NOT NULL)
);
-- Open webhook "reserva confirmada → credencial temporal" (Standard Webhooks). The secret is
-- encrypted like the signing key.
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS access_webhook_url text
  CHECK (access_webhook_url ~ '^https?://' AND length(access_webhook_url) <= 500);
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS access_webhook_secret bytea;
-- Outbox: one pending row per booking, coalesced; the payload is built from the booking's state
-- at delivery time, so no copy of personal data is stored here.
CREATE TABLE IF NOT EXISTS access_webhook_deliveries (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, booking_id uuid NOT NULL,
  changed_at timestamptz NOT NULL, available_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0, locked_until timestamptz,
  sent_at timestamptz, last_error text,
  FOREIGN KEY (tenant_id, booking_id) REFERENCES bookings(tenant_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS access_webhook_deliveries_pending
  ON access_webhook_deliveries(booking_id) WHERE sent_at IS NULL;
-- Every reservation change commits its delivery in the same transaction, whichever command made it.
CREATE OR REPLACE FUNCTION enqueue_access_webhook() RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM municipalities WHERE id = NEW.tenant_id AND access_webhook_url IS NOT NULL) THEN
    INSERT INTO access_webhook_deliveries (id, tenant_id, booking_id, changed_at, available_at)
      VALUES (gen_random_uuid(), NEW.tenant_id, NEW.id, clock_timestamp(), clock_timestamp())
      ON CONFLICT (booking_id) WHERE sent_at IS NULL
      DO UPDATE SET changed_at = EXCLUDED.changed_at, available_at = EXCLUDED.available_at, attempts = 0;
  END IF;
  RETURN NULL;
END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS bookings_access_webhook ON bookings;
CREATE TRIGGER bookings_access_webhook AFTER INSERT OR UPDATE OF status, starts_at, ends_at ON bookings
  FOR EACH ROW EXECUTE FUNCTION enqueue_access_webhook();
