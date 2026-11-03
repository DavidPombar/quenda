-- SPDX-License-Identifier: AGPL-3.0-or-later
-- People in an adult's care (#97, part C). An adult who declares parental authority or
-- guardianship adds a child by first name and year of birth only, and enrols them in activities
-- for their age. Lawful basis: art. 6.1.e GDPR (public sports service); the adult represents
-- the child (art. 7 LOPDGDD). Deleted with the account (T4).
CREATE TABLE IF NOT EXISTS dependants (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, user_id uuid NOT NULL,
  first_name text NOT NULL CHECK (length(first_name) BETWEEN 1 AND 60),
  birth_year integer NOT NULL CHECK (birth_year BETWEEN 1900 AND 2200),
  -- Version of the guardianship declaration the adult accepted, and when.
  declaration_version text NOT NULL CHECK (length(declaration_version) BETWEEN 1 AND 40),
  declared_at timestamptz NOT NULL, created_at timestamptz NOT NULL,
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id)
);
CREATE INDEX IF NOT EXISTS dependants_user ON dependants(tenant_id, user_id);
-- An enrolment is for the adult or for one of the people in their care.
ALTER TABLE activity_enrolments ADD COLUMN IF NOT EXISTS dependant_id uuid;
ALTER TABLE activity_enrolments DROP CONSTRAINT IF EXISTS activity_enrolments_dependant_fk;
ALTER TABLE activity_enrolments ADD CONSTRAINT activity_enrolments_dependant_fk
  FOREIGN KEY (tenant_id, dependant_id) REFERENCES dependants(tenant_id, id) ON DELETE SET NULL (dependant_id);
-- One open enrolment per activity, adult and participant.
DROP INDEX IF EXISTS activity_enrolments_open;
CREATE UNIQUE INDEX activity_enrolments_open ON activity_enrolments(
  tenant_id, activity_id, user_id, COALESCE(dependant_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE status IN ('enrolled', 'waiting');
