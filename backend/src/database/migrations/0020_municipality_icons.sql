-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Installable app (#24): a square 512 px PNG made from the logo by the backoffice, used as the
-- icon of the council's installed app. It belongs to the logo, so it goes with it.
ALTER TABLE municipality_logos ADD COLUMN IF NOT EXISTS icon bytea
  CHECK (octet_length(icon) BETWEEN 1 AND 524288);
ALTER TABLE municipality_logos ADD COLUMN IF NOT EXISTS icon_sha256 text;
ALTER TABLE municipality_logos DROP CONSTRAINT IF EXISTS municipality_logos_icon_check;
ALTER TABLE municipality_logos ADD CONSTRAINT municipality_logos_icon_check
  CHECK ((icon IS NULL) = (icon_sha256 IS NULL));
