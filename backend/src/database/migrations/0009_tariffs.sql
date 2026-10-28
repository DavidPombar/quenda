-- SPDX-License-Identifier: AGPL-3.0-or-later
-- User categories and per-category tariffs (M2, R2). The facility price_cents is the general
-- tariff; categories only apply once a manager verifies them.
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS enabled_categories text[] NOT NULL DEFAULT '{}'
  CHECK (enabled_categories <@ ARRAY['resident','family','local_club','minor','large_family','disability','senior']);
CREATE TABLE IF NOT EXISTS facility_prices (
  tenant_id uuid NOT NULL, facility_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('resident','family','local_club','minor','large_family','disability','senior')),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  PRIMARY KEY (tenant_id, facility_id, category),
  FOREIGN KEY (tenant_id, facility_id) REFERENCES facilities(tenant_id, id)
);
-- Only the category and its state are kept; supporting documents are checked outside the platform.
-- Rows are deleted with the account (they can reveal special-category data), so retention never meets them.
CREATE TABLE IF NOT EXISTS user_categories (
  tenant_id uuid NOT NULL, user_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('resident','family','local_club','minor','large_family','disability','senior')),
  status text NOT NULL CHECK (status IN ('requested','verified','rejected')),
  requested_at timestamptz, decided_at timestamptz,
  PRIMARY KEY (tenant_id, user_id, category),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id)
);
CREATE INDEX IF NOT EXISTS user_categories_pending ON user_categories(tenant_id, requested_at) WHERE status='requested';
ALTER TABLE users ADD COLUMN IF NOT EXISTS prefers_family_tariff boolean NOT NULL DEFAULT false;
-- Tariff in force when the booking was made or last rescheduled; NULL for older rows.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tariff_category text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price_cents integer CHECK (price_cents >= 0);
