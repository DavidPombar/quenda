-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Season allocation to clubs (#17): the manager registers organizations, opens campaigns and
-- gives clubs recurring weekly slots. Each dated occurrence occupies its units in booking_units,
-- so the existing exclusion constraint keeps club slots and one-off bookings apart.
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES municipalities(id),
  name text NOT NULL CHECK (length(name) BETWEEN 2 AND 120),
  tax_id text CHECK (length(tax_id) <= 20),
  sport text CHECK (sport IN ('padel', 'tennis', 'futsal', 'swimming')),
  contact_email text CHECK (length(contact_email) <= 254),
  created_at timestamptz NOT NULL, archived_at timestamptz,
  UNIQUE (tenant_id, id)
);
-- A person represents at most one club, so the link lives on the account.
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_organization_fk;
ALTER TABLE users ADD CONSTRAINT users_organization_fk
  FOREIGN KEY (tenant_id, organization_id) REFERENCES organizations(tenant_id, id);
CREATE TABLE IF NOT EXISTS season_campaigns (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES municipalities(id),
  name text NOT NULL CHECK (length(name) BETWEEN 2 AND 120),
  starts_on date NOT NULL, ends_on date NOT NULL CHECK (ends_on >= starts_on),
  -- Published priority criteria; the manager decides by hand.
  criteria_gl text NOT NULL DEFAULT '', criteria_es text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL,
  UNIQUE (tenant_id, id)
);
CREATE TABLE IF NOT EXISTS season_campaign_facilities (
  tenant_id uuid NOT NULL, campaign_id uuid NOT NULL, facility_id uuid NOT NULL,
  PRIMARY KEY (tenant_id, campaign_id, facility_id),
  FOREIGN KEY (tenant_id, campaign_id) REFERENCES season_campaigns(tenant_id, id),
  FOREIGN KEY (tenant_id, facility_id) REFERENCES facilities(tenant_id, id)
);
-- weekdays use ISO numbering (1 = Monday); times are local to the municipality.
CREATE TABLE IF NOT EXISTS season_allocations (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL,
  campaign_id uuid NOT NULL, organization_id uuid NOT NULL,
  facility_id uuid NOT NULL, resource_id uuid NOT NULL,
  weekdays smallint[] NOT NULL CHECK (cardinality(weekdays) BETWEEN 1 AND 7 AND weekdays <@ ARRAY[1,2,3,4,5,6,7]::smallint[]),
  starts_local time NOT NULL, ends_local time NOT NULL CHECK (ends_local > starts_local),
  reason text NOT NULL CHECK (length(reason) BETWEEN 1 AND 500),
  created_by uuid, created_at timestamptz NOT NULL,
  cancelled_at timestamptz, cancellation_reason text CHECK (length(cancellation_reason) <= 500),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, campaign_id) REFERENCES season_campaigns(tenant_id, id),
  FOREIGN KEY (tenant_id, organization_id) REFERENCES organizations(tenant_id, id),
  FOREIGN KEY (tenant_id, facility_id) REFERENCES facilities(tenant_id, id),
  FOREIGN KEY (tenant_id, resource_id) REFERENCES resources(tenant_id, id),
  FOREIGN KEY (tenant_id, created_by) REFERENCES users(tenant_id, id)
);
-- One row per dated occurrence. A conflict or a cancellation is an exception on that date only.
CREATE TABLE IF NOT EXISTS season_occurrences (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, allocation_id uuid NOT NULL,
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  status text NOT NULL CHECK (status IN ('active', 'conflict', 'cancelled')),
  conflict_booking_id uuid, cancellation_reason text CHECK (length(cancellation_reason) <= 500),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, allocation_id) REFERENCES season_allocations(tenant_id, id)
);
CREATE INDEX IF NOT EXISTS season_occurrences_allocation ON season_occurrences(tenant_id, allocation_id, starts_at);
-- booking_units now holds either a booking's units or a season occurrence's units.
ALTER TABLE booking_units DROP CONSTRAINT IF EXISTS booking_units_pkey;
ALTER TABLE booking_units ALTER COLUMN booking_id DROP NOT NULL;
ALTER TABLE booking_units ADD COLUMN IF NOT EXISTS occurrence_id uuid;
ALTER TABLE booking_units DROP CONSTRAINT IF EXISTS booking_units_occurrence_fk;
ALTER TABLE booking_units ADD CONSTRAINT booking_units_occurrence_fk
  FOREIGN KEY (tenant_id, occurrence_id) REFERENCES season_occurrences(tenant_id, id);
ALTER TABLE booking_units DROP CONSTRAINT IF EXISTS booking_units_owner;
ALTER TABLE booking_units ADD CONSTRAINT booking_units_owner
  CHECK (num_nonnulls(booking_id, occurrence_id) = 1);
CREATE UNIQUE INDEX IF NOT EXISTS booking_units_booking ON booking_units(tenant_id, booking_id, unit_id) WHERE booking_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS booking_units_occurrence ON booking_units(tenant_id, occurrence_id, unit_id) WHERE occurrence_id IS NOT NULL;
