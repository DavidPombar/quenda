-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Activities and sports schools (#97, part A): a course with weekly sessions on one court or lane,
-- places, ages, informative prices and an enrolment period. The weekly rule is kept as the
-- manager edits it and as the RFC 5545 text it produces; each dated session of a published
-- activity occupies its units in booking_units, exclusively, like a club's season slot (C1, M1, M2).
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES municipalities(id),
  facility_id uuid NOT NULL, resource_id uuid NOT NULL, sport text NOT NULL,
  name_gl text NOT NULL CHECK (length(name_gl) BETWEEN 2 AND 120),
  name_es text NOT NULL DEFAULT '' CHECK (length(name_es) <= 120),
  description_gl text NOT NULL DEFAULT '' CHECK (length(description_gl) <= 2000),
  description_es text NOT NULL DEFAULT '' CHECK (length(description_es) <= 2000),
  -- ISO weekdays (1 = Monday) and local times of every session; exceptions are skipped dates.
  weekdays smallint[] NOT NULL CHECK (cardinality(weekdays) BETWEEN 1 AND 7 AND weekdays <@ ARRAY[1,2,3,4,5,6,7]::smallint[]),
  starts_local time NOT NULL, ends_local time NOT NULL CHECK (ends_local > starts_local),
  starts_on date NOT NULL, ends_on date NOT NULL CHECK (ends_on >= starts_on),
  exceptions date[] NOT NULL DEFAULT '{}' CHECK (cardinality(exceptions) <= 200),
  -- The same rule as an RFC 5545 VCALENDAR (RRULE + EXDATE), for export and open data.
  schedule text NOT NULL CHECK (length(schedule) <= 65536),
  places integer NOT NULL CHECK (places BETWEEN 1 AND 500),
  min_age integer CHECK (min_age BETWEEN 0 AND 120),
  max_age integer CHECK (max_age BETWEEN 0 AND 120),
  -- Local dates, both included; the period closes before the activity ends.
  enrolment_opens_on date NOT NULL, enrolment_closes_on date NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'published', 'cancelled')),
  cancellation_reason text CHECK (length(cancellation_reason) <= 500),
  created_at timestamptz NOT NULL, published_at timestamptz, cancelled_at timestamptz,
  CHECK (min_age IS NULL OR max_age IS NULL OR min_age <= max_age),
  CHECK (enrolment_closes_on >= enrolment_opens_on AND enrolment_closes_on <= ends_on),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, facility_id) REFERENCES facilities(tenant_id, id),
  FOREIGN KEY (tenant_id, resource_id) REFERENCES resources(tenant_id, id),
  FOREIGN KEY (tenant_id, sport) REFERENCES sports(tenant_id, code)
);
CREATE INDEX IF NOT EXISTS activities_listing ON activities(tenant_id, status, ends_on);
-- Informative prices, like the facility tariffs: the general one and per user category.
CREATE TABLE IF NOT EXISTS activity_prices (
  tenant_id uuid NOT NULL, activity_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('general','resident','family','local_club','minor','large_family','disability','senior')),
  price_cents integer NOT NULL CHECK (price_cents BETWEEN 0 AND 10000000),
  PRIMARY KEY (tenant_id, activity_id, category),
  FOREIGN KEY (tenant_id, activity_id) REFERENCES activities(tenant_id, id) ON DELETE CASCADE
);
-- One row per dated session. A cancelled session is an exception on that date only; sequence
-- grows with every change so calendar subscribers replace the event (RFC 5545).
CREATE TABLE IF NOT EXISTS activity_sessions (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, activity_id uuid NOT NULL,
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  status text NOT NULL CHECK (status IN ('active', 'cancelled')),
  cancellation_reason text CHECK (length(cancellation_reason) <= 500),
  sequence integer NOT NULL DEFAULT 0,
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, activity_id) REFERENCES activities(tenant_id, id)
);
CREATE INDEX IF NOT EXISTS activity_sessions_activity ON activity_sessions(tenant_id, activity_id, starts_at);
CREATE OR REPLACE FUNCTION update_activity_session_sequence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.starts_at, NEW.ends_at, NEW.status) IS DISTINCT FROM (OLD.starts_at, OLD.ends_at, OLD.status) THEN
    NEW.sequence := OLD.sequence + 1;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS activity_session_sequence ON activity_sessions;
CREATE TRIGGER activity_session_sequence BEFORE UPDATE ON activity_sessions
  FOR EACH ROW EXECUTE FUNCTION update_activity_session_sequence();
-- A session is a fourth kind of owner of booking_units rows, always exclusive.
ALTER TABLE booking_units ADD COLUMN IF NOT EXISTS session_id uuid;
ALTER TABLE booking_units DROP CONSTRAINT IF EXISTS booking_units_session_fk;
ALTER TABLE booking_units ADD CONSTRAINT booking_units_session_fk
  FOREIGN KEY (tenant_id, session_id) REFERENCES activity_sessions(tenant_id, id);
ALTER TABLE booking_units DROP CONSTRAINT IF EXISTS booking_units_owner;
ALTER TABLE booking_units ADD CONSTRAINT booking_units_owner
  CHECK (num_nonnulls(booking_id, occurrence_id, waitlist_entry_id, session_id) = 1);
CREATE UNIQUE INDEX IF NOT EXISTS booking_units_session ON booking_units(tenant_id, session_id, unit_id)
  WHERE session_id IS NOT NULL;
