-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Personal calendars (optional "calendarios persoais"): an RFC 5545 SEQUENCE
-- per booking and one revocable subscription token per person.
ALTER TABLE bookings ADD COLUMN sequence integer NOT NULL DEFAULT 0 CHECK (sequence >= 0);
CREATE TABLE calendar_feeds (
  tenant_id uuid NOT NULL, user_id uuid NOT NULL,
  token_hash text UNIQUE NOT NULL, created_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, user_id),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id)
);
