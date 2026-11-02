-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Shared capacity (#95): a resource without parts may hold several people at once (a pool lane,
-- a gym). NULL keeps it exclusive. A booking of such a resource takes one place and its row is
-- marked shared; composite bookings, season occurrences and bookings of exclusive resources stay
-- exclusive. The exclusion constraint now guards exclusive rows only; places are counted under
-- the facility lock that every writer already takes (C2, M1).
ALTER TABLE resources ADD COLUMN IF NOT EXISTS capacity integer
  CHECK (capacity IS NULL OR capacity BETWEEN 2 AND 200);
ALTER TABLE booking_units ADD COLUMN IF NOT EXISTS shared boolean NOT NULL DEFAULT false;
ALTER TABLE booking_units DROP CONSTRAINT IF EXISTS booking_units_no_overlap;
ALTER TABLE booking_units ADD CONSTRAINT booking_units_no_overlap EXCLUDE USING gist (
  tenant_id WITH =, unit_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&
) WHERE (NOT shared);
