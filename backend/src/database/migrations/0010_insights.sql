-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Facility status over time, so indicators exclude past maintenance and closures (M3).
CREATE TABLE IF NOT EXISTS facility_status_periods (
  tenant_id uuid NOT NULL, facility_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'maintenance', 'closed')),
  starts_at timestamptz NOT NULL, ends_at timestamptz,
  PRIMARY KEY (tenant_id, facility_id, starts_at),
  CHECK (ends_at IS NULL OR ends_at > starts_at),
  FOREIGN KEY (tenant_id, facility_id) REFERENCES facilities(tenant_id, id)
);
-- One-off backfill from the audit trail for facilities without history. Facilities with no
-- creation event (seeded) are assumed to exist since 2000, the calendar horizon.
WITH missing AS (
  SELECT f.tenant_id, f.id, f.status FROM facilities f
  WHERE NOT EXISTS (SELECT 1 FROM facility_status_periods p WHERE p.tenant_id=f.tenant_id AND p.facility_id=f.id)
), events AS (
  SELECT a.tenant_id, a.resource_id AS facility_id, a.occurred_at, a.action,
    a.details->'before'->>'status' AS before_status, a.details->'after'->>'status' AS after_status
  FROM audit_events a JOIN missing m ON m.tenant_id=a.tenant_id AND m.id=a.resource_id
  WHERE a.action IN ('facility.created', 'facility.updated') AND a.details->'after' ? 'status'
), starts AS (
  SELECT m.tenant_id, m.id AS facility_id, '2000-01-01T00:00:00Z'::timestamptz AS starts_at,
    COALESCE((SELECT e.before_status FROM events e WHERE e.tenant_id=m.tenant_id AND e.facility_id=m.id AND e.action='facility.updated' ORDER BY e.occurred_at LIMIT 1), m.status) AS status
  FROM missing m
  WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.tenant_id=m.tenant_id AND e.facility_id=m.id AND e.action='facility.created')
  UNION ALL
  SELECT DISTINCT ON (tenant_id, facility_id, occurred_at) tenant_id, facility_id, occurred_at, after_status FROM events
)
INSERT INTO facility_status_periods (tenant_id, facility_id, status, starts_at, ends_at)
  SELECT tenant_id, facility_id, status, starts_at,
    lead(starts_at) OVER (PARTITION BY tenant_id, facility_id ORDER BY starts_at)
  FROM starts
  ON CONFLICT DO NOTHING;
