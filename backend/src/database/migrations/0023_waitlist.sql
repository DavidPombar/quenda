-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Waiting list for full slots (#96). A person waits for one slot of one court; when a place frees
-- it is held for the first person in the queue (a booking_units row owned by the entry) until
-- they confirm or the offer expires. Entries are deleted once the slot has passed; the
-- indicators keep only daily counts without personal data (C2, C4, M2, M3, T4).
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS waitlist_max_entries integer NOT NULL DEFAULT 3
  CHECK (waitlist_max_entries BETWEEN 0 AND 10);
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS waitlist_offer_minutes integer NOT NULL DEFAULT 30
  CHECK (waitlist_offer_minutes BETWEEN 5 AND 240);
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, user_id uuid NOT NULL,
  facility_id uuid NOT NULL, resource_id uuid NOT NULL,
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, created_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('waiting', 'offered', 'accepted', 'expired', 'left', 'closed')),
  offered_at timestamptz, offer_expires_at timestamptz, booking_id uuid,
  CHECK (ends_at > starts_at),
  CHECK (status <> 'offered' OR offer_expires_at IS NOT NULL),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id),
  FOREIGN KEY (tenant_id, facility_id) REFERENCES facilities(tenant_id, id),
  FOREIGN KEY (tenant_id, resource_id) REFERENCES resources(tenant_id, id),
  FOREIGN KEY (tenant_id, booking_id) REFERENCES bookings(tenant_id, id)
);
-- One open entry per person and slot of a court.
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_entries_open ON waitlist_entries(tenant_id, user_id, resource_id, starts_at)
  WHERE status IN ('waiting', 'offered');
CREATE INDEX IF NOT EXISTS waitlist_entries_queue ON waitlist_entries(tenant_id, facility_id, starts_at, created_at);
CREATE INDEX IF NOT EXISTS waitlist_entries_offers ON waitlist_entries(tenant_id, offer_expires_at)
  WHERE status = 'offered';
-- The hold of an open offer is a third kind of owner of booking_units rows.
ALTER TABLE booking_units ADD COLUMN IF NOT EXISTS waitlist_entry_id uuid;
ALTER TABLE booking_units DROP CONSTRAINT IF EXISTS booking_units_waitlist_fk;
ALTER TABLE booking_units ADD CONSTRAINT booking_units_waitlist_fk
  FOREIGN KEY (tenant_id, waitlist_entry_id) REFERENCES waitlist_entries(tenant_id, id);
ALTER TABLE booking_units DROP CONSTRAINT IF EXISTS booking_units_owner;
ALTER TABLE booking_units ADD CONSTRAINT booking_units_owner
  CHECK (num_nonnulls(booking_id, occurrence_id, waitlist_entry_id) = 1);
CREATE UNIQUE INDEX IF NOT EXISTS booking_units_waitlist ON booking_units(tenant_id, waitlist_entry_id, unit_id)
  WHERE waitlist_entry_id IS NOT NULL;
-- An offer's notices belong to the entry, not to a booking.
ALTER TABLE notifications ALTER COLUMN booking_id DROP NOT NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS waitlist_entry_id uuid;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_waitlist_fk;
ALTER TABLE notifications ADD CONSTRAINT notifications_waitlist_fk
  FOREIGN KEY (tenant_id, waitlist_entry_id) REFERENCES waitlist_entries(tenant_id, id) ON DELETE CASCADE;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_owner;
ALTER TABLE notifications ADD CONSTRAINT notifications_owner
  CHECK (num_nonnulls(booking_id, waitlist_entry_id) = 1);
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_kind_check CHECK (kind IN (
  'confirmed', 'rescheduled', 'cancelled', 'cancelled_by_municipality', 'no_show', 'blocked', 'unblocked',
  'reminder', 'waitlist_offer'
));
ALTER TABLE outbox ALTER COLUMN booking_id DROP NOT NULL;
ALTER TABLE outbox ADD COLUMN IF NOT EXISTS waitlist_entry_id uuid;
ALTER TABLE outbox DROP CONSTRAINT IF EXISTS outbox_waitlist_fk;
ALTER TABLE outbox ADD CONSTRAINT outbox_waitlist_fk
  FOREIGN KEY (tenant_id, waitlist_entry_id) REFERENCES waitlist_entries(tenant_id, id) ON DELETE CASCADE;
ALTER TABLE outbox DROP CONSTRAINT IF EXISTS outbox_owner;
ALTER TABLE outbox ADD CONSTRAINT outbox_owner
  CHECK (num_nonnulls(booking_id, waitlist_entry_id) = 1);
ALTER TABLE outbox DROP CONSTRAINT IF EXISTS outbox_kind_check;
ALTER TABLE outbox ADD CONSTRAINT outbox_kind_check CHECK (kind IN (
  'confirmed', 'rescheduled', 'cancelled', 'cancelled_by_municipality', 'reminder', 'no_show',
  'blocked', 'unblocked', 'waitlist_offer'
));
ALTER TABLE notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_kind_check;
ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_kind_check
  CHECK (kind IN ('confirmation', 'change', 'cancellation', 'reminder', 'penalty', 'waitlist'));
-- Offers accepted and expired per facility and local day, for the indicators (M3).
CREATE TABLE IF NOT EXISTS waitlist_outcomes (
  tenant_id uuid NOT NULL, facility_id uuid NOT NULL, day date NOT NULL,
  accepted integer NOT NULL DEFAULT 0 CHECK (accepted >= 0),
  expired integer NOT NULL DEFAULT 0 CHECK (expired >= 0),
  PRIMARY KEY (tenant_id, facility_id, day),
  FOREIGN KEY (tenant_id, facility_id) REFERENCES facilities(tenant_id, id)
);
