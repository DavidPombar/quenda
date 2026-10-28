-- SPDX-License-Identifier: AGPL-3.0-or-later
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
-- Moving a reservation to another court is a change of the calendar event too (C3, T3).
CREATE OR REPLACE FUNCTION update_booking_calendar_sequence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.starts_at, NEW.ends_at, NEW.status, NEW.facility_id, NEW.resource_id)
    IS DISTINCT FROM (OLD.starts_at, OLD.ends_at, OLD.status, OLD.facility_id, OLD.resource_id) THEN
    NEW.sequence := OLD.sequence + 1;
  END IF;
  RETURN NEW;
END;
$$;
