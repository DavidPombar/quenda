-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Public identity (T3, T4): generic OIDC sign-in with the account's assurance level, the
-- provider's identifiers and, only where the municipality verifies residency, the encrypted NIF.
-- Opt-in: the NIF is kept (encrypted) only for municipalities that verify residency.
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS store_nif boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS assurance text NOT NULL DEFAULT 'demo'
  CHECK (assurance IN ('demo','email','eid','local'));
-- AES-256-GCM, only when the municipality has store_nif.
ALTER TABLE users ADD COLUMN IF NOT EXISTS nif_ciphertext text;
-- HMAC-SHA256 of the normalised NIF, for lookups.
ALTER TABLE users ADD COLUMN IF NOT EXISTS nif_digest text;
-- External identities (OIDC issuer + subject); the same person gets one account per municipality.
CREATE TABLE IF NOT EXISTS identities (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, user_id uuid NOT NULL,
  issuer text NOT NULL, subject text NOT NULL, created_at timestamptz NOT NULL,
  UNIQUE (tenant_id, issuer, subject),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id)
);
CREATE INDEX IF NOT EXISTS identities_user ON identities(tenant_id, user_id);
-- Pending OIDC sign-ins (state/nonce/PKCE), keyed by the SHA-256 of the state; short-lived.
CREATE TABLE IF NOT EXISTS login_attempts (
  state_hash text PRIMARY KEY, tenant_id uuid NOT NULL, nonce text NOT NULL,
  code_verifier text NOT NULL, legal_version text, return_to text NOT NULL,
  expires_at timestamptz NOT NULL
);
