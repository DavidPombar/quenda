-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Light sign-in with an email address and a one-time code (#8, part B). A code row holds the
-- address and the code in clear only until the mail is sent; afterwards only their hashes stay,
-- and retention removes the row a day after it expires.
CREATE TABLE IF NOT EXISTS login_codes (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES municipalities(id),
  -- SHA-256 of the normalised address: finds the latest code and counts requests per hour.
  email_hash text NOT NULL,
  recipient text CHECK (length(recipient) <= 254),
  pending_code text CHECK (pending_code ~ '^[0-9]{6}$'),
  code_hash text NOT NULL,
  legal_version text NOT NULL,
  locale text NOT NULL CHECK (locale IN ('gl', 'es')),
  attempts integer NOT NULL DEFAULT 0,
  send_attempts integer NOT NULL DEFAULT 0,
  -- Lease so two workers (or the request and a worker) never send the same code twice at once.
  locked_until timestamptz,
  last_error text CHECK (length(last_error) <= 500),
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  sent_at timestamptz,
  consumed_at timestamptz
);
CREATE INDEX IF NOT EXISTS login_codes_email ON login_codes(tenant_id, email_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS login_codes_unsent ON login_codes(created_at) WHERE sent_at IS NULL AND pending_code IS NOT NULL;
