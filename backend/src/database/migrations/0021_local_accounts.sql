-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Local accounts with a password and a second factor (#8, part C) for the people who run the
-- service: municipal managers, door staff and the deployment's operators. Citizens never get one.
CREATE TABLE IF NOT EXISTS credentials (
  id uuid PRIMARY KEY,
  -- 'tenant': a user of one municipality (manager or door staff); 'operator': the deployment's.
  realm text NOT NULL CHECK (realm IN ('tenant', 'operator')),
  tenant_id uuid REFERENCES municipalities(id),
  subject_id uuid NOT NULL,
  login text NOT NULL CHECK (login ~ '^[a-z0-9._-]{3,64}$'),
  -- scrypt, self-describing: scrypt$N$r$p$salt$hash.
  password_hash text NOT NULL,
  must_change_password boolean NOT NULL DEFAULT true,
  -- TOTP secret encrypted with QUENDA_DATA_KEY; confirmed once the person enters a first code.
  totp_secret text,
  totp_confirmed_at timestamptz,
  -- Last accepted 30-second step, so a code is never accepted twice.
  totp_last_step bigint,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  disabled_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK ((realm = 'tenant') = (tenant_id IS NOT NULL)),
  UNIQUE NULLS NOT DISTINCT (realm, tenant_id, login),
  UNIQUE (realm, subject_id)
);
-- A sign-in in progress between the password and the second factor; the raw ticket only travels
-- to the browser.
CREATE TABLE IF NOT EXISTS login_tickets (
  ticket_hash text PRIMARY KEY,
  credential_id uuid NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  step text NOT NULL CHECK (step IN ('password_change', 'enroll', 'totp')),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS login_tickets_expiry ON login_tickets(expires_at);
