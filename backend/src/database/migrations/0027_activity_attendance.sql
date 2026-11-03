-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Attendance at activity sessions (#97, part D): the gate staff take the roll for each session,
-- possibly offline; the latest mark per person and session wins. Marks go with the enrolment
-- when retention deletes it, and absences carry no penalty (M3, T4).
CREATE TABLE IF NOT EXISTS activity_attendance (
  tenant_id uuid NOT NULL, session_id uuid NOT NULL, enrolment_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent')),
  recorded_at timestamptz NOT NULL, actor_id uuid,
  PRIMARY KEY (tenant_id, session_id, enrolment_id),
  FOREIGN KEY (tenant_id, session_id) REFERENCES activity_sessions(tenant_id, id),
  FOREIGN KEY (tenant_id, enrolment_id) REFERENCES activity_enrolments(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, actor_id) REFERENCES users(tenant_id, id)
);
CREATE INDEX IF NOT EXISTS activity_attendance_enrolment ON activity_attendance(tenant_id, enrolment_id);
