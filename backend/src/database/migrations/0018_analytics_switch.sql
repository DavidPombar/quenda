-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Web analytics moves to the deployment's own Umami (#57): each municipality keeps only an
-- on/off switch, off by default. Councils that had configured their own Umami stay switched on.
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS analytics_enabled boolean NOT NULL DEFAULT false;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'municipalities' AND column_name = 'analytics_url') THEN
    UPDATE municipalities SET analytics_enabled = true WHERE analytics_url <> '';
  END IF;
END $$;
ALTER TABLE municipalities DROP CONSTRAINT IF EXISTS municipalities_analytics_check;
ALTER TABLE municipalities DROP COLUMN IF EXISTS analytics_url;
ALTER TABLE municipalities DROP COLUMN IF EXISTS analytics_website_id;
