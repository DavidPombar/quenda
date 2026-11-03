-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Enrolment in activities (#97, part B). An adult enrols in a published activity while its
-- enrolment period is open; past the places they wait in order of arrival and the first person
-- waiting moves up on their own when a place frees. Enrolments are deleted with the activity's
-- history after the retention period (C2, C4, M2, T4).
CREATE TABLE IF NOT EXISTS activity_enrolments (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, activity_id uuid NOT NULL, user_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('enrolled', 'waiting', 'left', 'removed', 'cancelled')),
  created_at timestamptz NOT NULL, enrolled_at timestamptz, ended_at timestamptz,
  removal_reason text CHECK (length(removal_reason) <= 500),
  CHECK (status <> 'enrolled' OR enrolled_at IS NOT NULL),
  CHECK ((status IN ('enrolled', 'waiting')) = (ended_at IS NULL)),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, activity_id) REFERENCES activities(tenant_id, id),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id)
);
-- One open enrolment per person and activity.
CREATE UNIQUE INDEX IF NOT EXISTS activity_enrolments_open ON activity_enrolments(tenant_id, activity_id, user_id)
  WHERE status IN ('enrolled', 'waiting');
CREATE INDEX IF NOT EXISTS activity_enrolments_queue ON activity_enrolments(tenant_id, activity_id, status, created_at);
CREATE INDEX IF NOT EXISTS activity_enrolments_user ON activity_enrolments(tenant_id, user_id);
-- An enrolment's notices belong to it; the session says which cancelled date a notice is about.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS enrolment_id uuid;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS activity_session_id uuid;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_enrolment_fk;
ALTER TABLE notifications ADD CONSTRAINT notifications_enrolment_fk
  FOREIGN KEY (tenant_id, enrolment_id) REFERENCES activity_enrolments(tenant_id, id) ON DELETE CASCADE;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_session_fk;
ALTER TABLE notifications ADD CONSTRAINT notifications_session_fk
  FOREIGN KEY (tenant_id, activity_session_id) REFERENCES activity_sessions(tenant_id, id);
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_owner;
ALTER TABLE notifications ADD CONSTRAINT notifications_owner
  CHECK (num_nonnulls(booking_id, waitlist_entry_id, enrolment_id) = 1);
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_kind_check CHECK (kind IN (
  'confirmed', 'rescheduled', 'cancelled', 'cancelled_by_municipality', 'no_show', 'blocked', 'unblocked',
  'reminder', 'waitlist_offer', 'enrolment_confirmed', 'enrolment_waiting', 'enrolment_promoted',
  'enrolment_removed', 'activity_session_cancelled', 'activity_cancelled'
));
ALTER TABLE outbox ADD COLUMN IF NOT EXISTS enrolment_id uuid;
ALTER TABLE outbox ADD COLUMN IF NOT EXISTS activity_session_id uuid;
ALTER TABLE outbox DROP CONSTRAINT IF EXISTS outbox_enrolment_fk;
ALTER TABLE outbox ADD CONSTRAINT outbox_enrolment_fk
  FOREIGN KEY (tenant_id, enrolment_id) REFERENCES activity_enrolments(tenant_id, id) ON DELETE CASCADE;
ALTER TABLE outbox DROP CONSTRAINT IF EXISTS outbox_session_fk;
ALTER TABLE outbox ADD CONSTRAINT outbox_session_fk
  FOREIGN KEY (tenant_id, activity_session_id) REFERENCES activity_sessions(tenant_id, id);
ALTER TABLE outbox DROP CONSTRAINT IF EXISTS outbox_owner;
ALTER TABLE outbox ADD CONSTRAINT outbox_owner
  CHECK (num_nonnulls(booking_id, waitlist_entry_id, enrolment_id) = 1);
ALTER TABLE outbox DROP CONSTRAINT IF EXISTS outbox_kind_check;
ALTER TABLE outbox ADD CONSTRAINT outbox_kind_check CHECK (kind IN (
  'confirmed', 'rescheduled', 'cancelled', 'cancelled_by_municipality', 'reminder', 'no_show',
  'blocked', 'unblocked', 'waitlist_offer', 'enrolment_confirmed', 'enrolment_waiting',
  'enrolment_promoted', 'enrolment_removed', 'activity_session_cancelled', 'activity_cancelled'
));
