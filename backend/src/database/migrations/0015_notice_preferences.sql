-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Notice preferences per kind and channel (#35) and Web Push devices. A missing preference row
-- means the default in shared/application/notice-preferences.ts; the in-app notice is always kept.
ALTER TABLE notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_kind_check;
ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_kind_check
  CHECK (kind IN ('confirmation', 'change', 'cancellation', 'reminder', 'penalty'));
ALTER TABLE notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_channel_check;
ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_channel_check
  CHECK (channel IN ('email', 'push'));
-- One row per browser that accepted notices; the endpoint and keys are credentials for that
-- browser's push service and are removed when it answers 404 or 410.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, user_id uuid NOT NULL,
  endpoint text NOT NULL CHECK (length(endpoint) <= 1000),
  p256dh text NOT NULL CHECK (length(p256dh) <= 200),
  auth text NOT NULL CHECK (length(auth) <= 100),
  user_agent text NOT NULL DEFAULT '' CHECK (length(user_agent) <= 300),
  created_at timestamptz NOT NULL,
  UNIQUE (tenant_id, endpoint),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id)
);
CREATE INDEX IF NOT EXISTS push_subscriptions_user ON push_subscriptions(tenant_id, user_id);
ALTER TABLE outbox DROP CONSTRAINT IF EXISTS outbox_channel_check;
ALTER TABLE outbox ADD CONSTRAINT outbox_channel_check CHECK (channel IN ('email', 'push', 'webhook'));
ALTER TABLE outbox DROP CONSTRAINT IF EXISTS outbox_kind_check;
ALTER TABLE outbox ADD CONSTRAINT outbox_kind_check CHECK (kind IN (
  'confirmed', 'rescheduled', 'cancelled', 'cancelled_by_municipality', 'reminder', 'no_show',
  'blocked', 'unblocked'
));
-- Marks the in-app reminder of one start time, so it is created once whatever the channels.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS dedupe_key text;
CREATE UNIQUE INDEX IF NOT EXISTS notifications_dedupe_key ON notifications(dedupe_key)
  WHERE dedupe_key IS NOT NULL;
