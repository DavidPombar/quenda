-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Open data (T3): licence of each municipality's published datasets, DIR3 code of the council
-- as DCAT publisher, and optional WGS 84 coordinates of each facility for GeoJSON.
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS data_license text NOT NULL DEFAULT 'CC-BY-4.0'
  CHECK (data_license IN ('CC-BY-4.0', 'CC-BY-SA-4.0', 'CC0-1.0', 'ODbL-1.0'));
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS dir3_code text
  CHECK (dir3_code ~ '^[A-Z0-9]{9}$');
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS latitude double precision
  CHECK (latitude BETWEEN -90 AND 90);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS longitude double precision
  CHECK (longitude BETWEEN -180 AND 180);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'facilities_coordinates_pair' AND conrelid = 'facilities'::regclass
  ) THEN
    ALTER TABLE facilities ADD CONSTRAINT facilities_coordinates_pair
      CHECK ((latitude IS NULL) = (longitude IS NULL));
  END IF;
END $$;
