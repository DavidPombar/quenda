-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Supramunicipal operators (deputación, mancomunidade) live outside any tenant (R3, #18).
CREATE TABLE IF NOT EXISTS operators (
  id uuid PRIMARY KEY, display_name text NOT NULL, email text, deleted_at timestamptz
);
CREATE TABLE IF NOT EXISTS operator_sessions (
  token_hash text PRIMARY KEY, operator_id uuid NOT NULL REFERENCES operators(id),
  expires_at timestamptz NOT NULL
);
-- Deployment-level trail of operator actions; tenant_id names the affected municipality, if any.
CREATE TABLE IF NOT EXISTS operator_audit_events (
  id uuid PRIMARY KEY, actor_id uuid REFERENCES operators(id), action text NOT NULL,
  tenant_id uuid REFERENCES municipalities(id), resource_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL, details jsonb
);
CREATE INDEX IF NOT EXISTS operator_audit_events_time ON operator_audit_events(occurred_at DESC);
-- Staff contact address, used to link managers to an identity provider (#36).
ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;
