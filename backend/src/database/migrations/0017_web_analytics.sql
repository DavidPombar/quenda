-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Optional web analytics per municipality (#25): the council's own Umami. Empty URL = disabled.
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS analytics_url text NOT NULL DEFAULT ''
  CHECK (length(analytics_url) <= 300);
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS analytics_website_id uuid;
ALTER TABLE municipalities DROP CONSTRAINT IF EXISTS municipalities_analytics_check;
ALTER TABLE municipalities ADD CONSTRAINT municipalities_analytics_check
  CHECK ((analytics_url = '') = (analytics_website_id IS NULL));
