-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Accessibility statement data (RD 1112/2018, T5); editable through the municipal settings once they exist.
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS accessibility_unit text NOT NULL DEFAULT '';
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS accessibility_email text NOT NULL DEFAULT '';
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS accessibility_phone text NOT NULL DEFAULT '';
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS accessibility_reviewed_on date NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS accessibility_method text NOT NULL DEFAULT 'self'
  CHECK (accessibility_method IN ('self', 'external'));
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS accessibility_exceptions_gl text NOT NULL DEFAULT '';
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS accessibility_exceptions_es text NOT NULL DEFAULT '';
