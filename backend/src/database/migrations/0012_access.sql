-- SPDX-License-Identifier: AGPL-3.0-or-later
-- QR access (#23): staff who only check people in and mark absences.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('citizen', 'manager', 'access'));
-- Per-municipality ES256 keys for offline-verifiable access passes; the private key is sealed.
-- The active key has retired_at NULL; retired keys stay published briefly for passes already issued.
CREATE TABLE IF NOT EXISTS access_keys (
  kid text PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES municipalities(id),
  public_jwk jsonb NOT NULL, private_key_sealed text NOT NULL,
  created_at timestamptz NOT NULL, retired_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS access_keys_active ON access_keys(tenant_id) WHERE retired_at IS NULL;
-- Proof of attendance recorded at the door; checked_in_at is the scan time, possibly before the sync.
CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, booking_id uuid NOT NULL,
  booking_sequence integer NOT NULL,
  checked_in_at timestamptz NOT NULL, recorded_at timestamptz NOT NULL,
  actor_id uuid, method text NOT NULL CHECK (method IN ('qr', 'manual')),
  UNIQUE (tenant_id, booking_id, booking_sequence),
  FOREIGN KEY (tenant_id, booking_id) REFERENCES bookings(tenant_id, id),
  FOREIGN KEY (tenant_id, actor_id) REFERENCES users(tenant_id, id)
);
-- Access-control connector: booking changes become signed webhook calls to the council's system.
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS access_webhook_url text NOT NULL DEFAULT '';
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS access_webhook_secret_sealed text;
ALTER TABLE outbox DROP CONSTRAINT IF EXISTS outbox_channel_check;
ALTER TABLE outbox ADD CONSTRAINT outbox_channel_check CHECK (channel IN ('email', 'webhook'));
ALTER TABLE outbox DROP CONSTRAINT IF EXISTS outbox_kind_check;
ALTER TABLE outbox ADD CONSTRAINT outbox_kind_check CHECK (kind IN (
  'confirmed', 'rescheduled', 'cancelled', 'cancelled_by_municipality', 'reminder', 'no_show'
));
