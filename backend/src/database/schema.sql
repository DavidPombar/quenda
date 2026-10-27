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
-- resource_id is added by the resources upgrade below; overlaps are excluded on booking_units.
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, user_id uuid, facility_id uuid NOT NULL,
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('confirmed', 'cancelled')),
  created_at timestamptz NOT NULL, cancelled_at timestamptz,
  CHECK (ends_at > starts_at),
  CHECK ((status = 'confirmed' AND cancelled_at IS NULL) OR (status = 'cancelled' AND cancelled_at IS NOT NULL)),
  FOREIGN KEY (tenant_id, facility_id) REFERENCES facilities(tenant_id, id),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id),
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
  'confirmed', 'rescheduled', 'cancelled', 'cancelled_by_municipality', 'no_show', 'blocked', 'unblocked',
  'reminder'
));
-- Snapshot shown with the notice: the municipal reason or the penalty standing at that moment.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS details jsonb;
-- Email notices (C4): optional contact data, per-municipality sender and reminder lead time.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locale text CHECK (locale IN ('gl', 'es'));
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS reminder_hours integer NOT NULL DEFAULT 24
  CHECK (reminder_hours BETWEEN 1 AND 168);
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS mail_sender_name text NOT NULL DEFAULT '';
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS mail_reply_to text NOT NULL DEFAULT '';
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
  kind text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email')),
  dedupe_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL, available_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0, locked_until timestamptz,
  sent_at timestamptz, last_error text,
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id),
  FOREIGN KEY (tenant_id, booking_id) REFERENCES bookings(tenant_id, id)
);
CREATE INDEX IF NOT EXISTS outbox_pending ON outbox(available_at) WHERE sent_at IS NULL;
ALTER TABLE outbox DROP CONSTRAINT IF EXISTS outbox_kind_check;
ALTER TABLE outbox ADD CONSTRAINT outbox_kind_check CHECK (kind IN (
  'confirmed', 'rescheduled', 'cancelled', 'cancelled_by_municipality', 'reminder'
));

-- Resources (M1): bookable courts or spaces of a facility. A resource with parts (children whose
-- parent_id is it) is composite; parts cannot have parts (one level, enforced by the application).
-- Units are the resources without parts: booking a composite occupies all its parts, booking a
-- part or a simple resource occupies only itself.
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, facility_id uuid NOT NULL,
  name text NOT NULL, position integer NOT NULL DEFAULT 0, parent_id uuid,
  active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (parent_id IS NULL OR parent_id <> id),
  FOREIGN KEY (tenant_id, facility_id) REFERENCES facilities(tenant_id, id),
  UNIQUE(tenant_id, id),
  UNIQUE(tenant_id, facility_id, id),
  -- A part belongs to a resource of the same facility (not checked while parent_id is NULL).
  FOREIGN KEY (tenant_id, facility_id, parent_id) REFERENCES resources(tenant_id, facility_id, id)
);
CREATE INDEX IF NOT EXISTS resources_facility ON resources(tenant_id, facility_id, position);
-- Occupied units of confirmed reservations and of no-shows (the court was still held); cancelling
-- deletes them. Rows carry no personal data. The exclusion constraint is the overlap guarantee,
-- also under concurrent requests.
CREATE TABLE IF NOT EXISTS booking_units (
  tenant_id uuid NOT NULL, booking_id uuid NOT NULL, unit_id uuid NOT NULL,
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
  CHECK (ends_at > starts_at),
  PRIMARY KEY (tenant_id, booking_id, unit_id),
  FOREIGN KEY (tenant_id, booking_id) REFERENCES bookings(tenant_id, id),
  FOREIGN KEY (tenant_id, unit_id) REFERENCES resources(tenant_id, id),
  CONSTRAINT booking_units_no_overlap EXCLUDE USING gist (
    tenant_id WITH =, unit_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&
  )
);
-- Every facility without resources gets a default one with the facility's id and name, so
-- existing reservations need no id translation.
INSERT INTO resources (id, tenant_id, facility_id, name, position, parent_id, active)
SELECT f.id, f.tenant_id, f.id, f.name, 0, NULL, true FROM facilities f
WHERE NOT EXISTS (
  SELECT 1 FROM resources r WHERE r.tenant_id = f.tenant_id AND r.facility_id = f.id
)
ON CONFLICT (id) DO NOTHING;
-- One-time upgrade of reservations created before resources existed: point them at the default
-- resource and copy confirmed ones into booking_units before the facility-wide exclusion goes.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'bookings' AND column_name = 'resource_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN resource_id uuid;
    UPDATE bookings SET resource_id = facility_id WHERE resource_id IS NULL;
    ALTER TABLE bookings ALTER COLUMN resource_id SET NOT NULL;
    INSERT INTO booking_units (tenant_id, booking_id, unit_id, starts_at, ends_at)
    SELECT b.tenant_id, b.id, coalesce(part.id, r.id), b.starts_at, b.ends_at
    FROM bookings b
    JOIN resources r ON r.tenant_id = b.tenant_id AND r.id = b.resource_id
    LEFT JOIN resources part ON part.tenant_id = r.tenant_id AND part.parent_id = r.id
    WHERE b.status IN ('confirmed', 'no_show')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap;
-- The booked resource belongs to the reservation's facility and municipality.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_resource_fk' AND conrelid = 'bookings'::regclass
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_resource_fk
      FOREIGN KEY (tenant_id, facility_id, resource_id) REFERENCES resources(tenant_id, facility_id, id);
  END IF;
END $$;
