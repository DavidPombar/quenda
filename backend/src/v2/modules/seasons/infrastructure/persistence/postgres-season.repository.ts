// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Database } from "../../../../shared/infrastructure/database";
import {
  AllocationRecord,
  CampaignRecord,
  OrganizationRecord,
  SeasonRepository,
  SlotResource,
} from "../../domain/season.repository";
import {
  Allocation,
  Campaign,
  ClubOccurrence,
  Organization,
} from "../../domain/season.read-model";
const instant = (value: string) => Temporal.Instant.from(value);
const optionalInstant = (value: string | null) =>
  value === null ? null : Temporal.Instant.from(value);
interface CampaignRow {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  criteriaGl: string;
  criteriaEs: string;
  facilityIds: string[];
  createdAt: string;
}
const campaignColumns = `c.id, c.name, to_char(c.starts_on, 'YYYY-MM-DD') AS "startsOn", to_char(c.ends_on, 'YYYY-MM-DD') AS "endsOn",
  c.criteria_gl AS "criteriaGl", c.criteria_es AS "criteriaEs", c.created_at AS "createdAt",
  ARRAY(SELECT f.facility_id FROM season_campaign_facilities f WHERE f.tenant_id=c.tenant_id AND f.campaign_id=c.id ORDER BY f.facility_id) AS "facilityIds"`;
function campaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    name: row.name,
    startsOn: row.startsOn,
    endsOn: row.endsOn,
    criteria: { gl: row.criteriaGl, es: row.criteriaEs },
    facilityIds: row.facilityIds,
    createdAt: instant(row.createdAt),
  };
}
interface AllocationRow {
  id: string;
  campaignId: string;
  organizationId: string;
  organizationName: string;
  facilityId: string;
  facilityName: string;
  resourceId: string;
  resourceName: string;
  weekdays: number[];
  startsLocal: string;
  endsLocal: string;
  reason: string;
  createdAt: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  active: number;
  cancelled: number;
  conflicts: {
    occurrenceId: string;
    start: string;
    end: string;
    bookingId: string | null;
  }[];
  dates: { id: string; start: string; end: string }[];
}
const allocationSql = `SELECT a.id, a.campaign_id AS "campaignId", a.organization_id AS "organizationId", o.name AS "organizationName",
  a.facility_id AS "facilityId", f.name AS "facilityName", a.resource_id AS "resourceId", r.name AS "resourceName",
  a.weekdays::int[] AS weekdays, to_char(a.starts_local, 'HH24:MI') AS "startsLocal", to_char(a.ends_local, 'HH24:MI') AS "endsLocal",
  a.reason, a.created_at AS "createdAt", a.cancelled_at AS "cancelledAt", a.cancellation_reason AS "cancellationReason",
  (SELECT count(*)::int FROM season_occurrences s WHERE s.tenant_id=a.tenant_id AND s.allocation_id=a.id AND s.status='active') AS active,
  (SELECT count(*)::int FROM season_occurrences s WHERE s.tenant_id=a.tenant_id AND s.allocation_id=a.id AND s.status='cancelled') AS cancelled,
  coalesce((SELECT json_agg(json_build_object('occurrenceId', s.id, 'start', s.starts_at, 'end', s.ends_at, 'bookingId', s.conflict_booking_id) ORDER BY s.starts_at)
    FROM season_occurrences s WHERE s.tenant_id=a.tenant_id AND s.allocation_id=a.id AND s.status='conflict'), '[]') AS conflicts,
  coalesce((SELECT json_agg(json_build_object('id', s.id, 'start', s.starts_at, 'end', s.ends_at) ORDER BY s.starts_at)
    FROM season_occurrences s WHERE s.tenant_id=a.tenant_id AND s.allocation_id=a.id AND s.status='active' AND s.starts_at>now()), '[]') AS dates
FROM season_allocations a
JOIN organizations o ON o.tenant_id=a.tenant_id AND o.id=a.organization_id
JOIN facilities f ON f.tenant_id=a.tenant_id AND f.id=a.facility_id
JOIN resources r ON r.tenant_id=a.tenant_id AND r.id=a.resource_id`;
function allocation(row: AllocationRow): Allocation {
  return {
    ...row,
    createdAt: instant(row.createdAt),
    cancelledAt: optionalInstant(row.cancelledAt),
    conflicts: row.conflicts.map((item) => ({
      occurrenceId: item.occurrenceId,
      start: instant(item.start),
      end: instant(item.end),
      bookingId: item.bookingId,
    })),
    dates: row.dates.map((item) => ({
      id: item.id,
      start: instant(item.start),
      end: instant(item.end),
    })),
  };
}
@Injectable()
export class PostgresSeasonRepository extends SeasonRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async listOrganizations(tenantId: string) {
    const { rows } = await this.db.query<
      Omit<Organization, "createdAt" | "archivedAt"> & {
        createdAt: string;
        archivedAt: string | null;
      }
    >(
      `SELECT o.id, o.name, o.tax_id AS "taxId", o.sport, o.contact_email AS "contactEmail",
        o.created_at AS "createdAt", o.archived_at AS "archivedAt",
        coalesce((SELECT json_agg(json_build_object('userId', u.id, 'displayName', u.display_name, 'email', u.email) ORDER BY u.display_name)
          FROM users u WHERE u.tenant_id=o.tenant_id AND u.organization_id=o.id AND u.deleted_at IS NULL), '[]') AS representatives
      FROM organizations o WHERE o.tenant_id=$1 ORDER BY o.archived_at IS NOT NULL, o.name`,
      [tenantId],
    );
    return rows.map((row) => ({
      ...row,
      createdAt: instant(row.createdAt),
      archivedAt: optionalInstant(row.archivedAt),
    }));
  }
  async findOrganization(tenantId: string, id: string) {
    const { rows } = await this.db.query<
      Omit<OrganizationRecord, "createdAt" | "archivedAt"> & {
        createdAt: string;
        archivedAt: string | null;
      }
    >(
      'SELECT id, tenant_id AS "tenantId", name, tax_id AS "taxId", sport, contact_email AS "contactEmail", created_at AS "createdAt", archived_at AS "archivedAt" FROM organizations WHERE tenant_id=$1 AND id=$2',
      [tenantId, id],
    );
    const row = rows[0];
    return row
      ? {
          ...row,
          createdAt: instant(row.createdAt),
          archivedAt: optionalInstant(row.archivedAt),
        }
      : null;
  }
  async saveOrganization(record: OrganizationRecord) {
    await this.db.query(
      `INSERT INTO organizations (id,tenant_id,name,tax_id,sport,contact_email,created_at,archived_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, tax_id=EXCLUDED.tax_id, sport=EXCLUDED.sport, contact_email=EXCLUDED.contact_email, archived_at=EXCLUDED.archived_at`,
      [
        record.id,
        record.tenantId,
        record.name,
        record.taxId,
        record.sport,
        record.contactEmail,
        record.createdAt.toString(),
        record.archivedAt?.toString() ?? null,
      ],
    );
  }
  async findCitizenByEmail(tenantId: string, email: string) {
    const { rows } = await this.db.query<{
      userId: string;
      organizationId: string | null;
    }>(
      `SELECT id AS "userId", organization_id AS "organizationId" FROM users
      WHERE tenant_id=$1 AND role='citizen' AND deleted_at IS NULL AND lower(email)=lower($2)
      ORDER BY id LIMIT 1 FOR UPDATE`,
      [tenantId, email],
    );
    return rows[0] ?? null;
  }
  async setRepresentative(
    tenantId: string,
    userId: string,
    organizationId: string | null,
  ) {
    await this.db.query(
      "UPDATE users SET organization_id=$3 WHERE tenant_id=$1 AND id=$2",
      [tenantId, userId, organizationId],
    );
  }
  async removeRepresentative(
    tenantId: string,
    organizationId: string,
    userId: string,
  ) {
    const { rowCount } = await this.db.query(
      "UPDATE users SET organization_id=NULL WHERE tenant_id=$1 AND id=$3 AND organization_id=$2",
      [tenantId, organizationId, userId],
    );
    return (rowCount ?? 0) > 0;
  }
  async listCampaigns(tenantId: string) {
    const { rows } = await this.db.query<CampaignRow>(
      `SELECT ${campaignColumns} FROM season_campaigns c WHERE c.tenant_id=$1 ORDER BY c.starts_on DESC, c.name`,
      [tenantId],
    );
    return rows.map(campaign);
  }
  async currentCampaigns(tenantId: string, today: string) {
    const { rows } = await this.db.query<CampaignRow>(
      `SELECT ${campaignColumns} FROM season_campaigns c WHERE c.tenant_id=$1 AND c.ends_on >= $2::date ORDER BY c.starts_on, c.name`,
      [tenantId, today],
    );
    return rows.map(campaign);
  }
  async findCampaign(tenantId: string, id: string) {
    const { rows } = await this.db.query<CampaignRow>(
      `SELECT ${campaignColumns} FROM season_campaigns c WHERE c.tenant_id=$1 AND c.id=$2`,
      [tenantId, id],
    );
    const row = rows[0];
    return row ? { ...row, tenantId, createdAt: instant(row.createdAt) } : null;
  }
  async saveCampaign(record: CampaignRecord) {
    await this.db.query(
      `INSERT INTO season_campaigns (id,tenant_id,name,starts_on,ends_on,criteria_gl,criteria_es,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, starts_on=EXCLUDED.starts_on, ends_on=EXCLUDED.ends_on, criteria_gl=EXCLUDED.criteria_gl, criteria_es=EXCLUDED.criteria_es`,
      [
        record.id,
        record.tenantId,
        record.name,
        record.startsOn,
        record.endsOn,
        record.criteriaGl,
        record.criteriaEs,
        record.createdAt.toString(),
      ],
    );
    await this.db.query(
      "DELETE FROM season_campaign_facilities WHERE tenant_id=$1 AND campaign_id=$2 AND NOT (facility_id = ANY($3::uuid[]))",
      [record.tenantId, record.id, record.facilityIds],
    );
    await this.db.query(
      "INSERT INTO season_campaign_facilities (tenant_id,campaign_id,facility_id) SELECT $1,$2,unnest($3::uuid[]) ON CONFLICT DO NOTHING",
      [record.tenantId, record.id, record.facilityIds],
    );
  }
  async existingFacilities(tenantId: string, ids: readonly string[]) {
    const { rows } = await this.db.query<{ id: string }>(
      "SELECT id FROM facilities WHERE tenant_id=$1 AND id = ANY($2::uuid[])",
      [tenantId, [...ids]],
    );
    return rows.map((row) => row.id);
  }
  async lockFacility(tenantId: string, facilityId: string) {
    const { rowCount } = await this.db.query(
      "SELECT id FROM facilities WHERE tenant_id=$1 AND id=$2 FOR UPDATE",
      [tenantId, facilityId],
    );
    return (rowCount ?? 0) > 0;
  }
  async resources(tenantId: string, facilityId: string) {
    return (
      await this.db.query<SlotResource>(
        'SELECT id, parent_id AS "parentId", active FROM resources WHERE tenant_id=$1 AND facility_id=$2',
        [tenantId, facilityId],
      )
    ).rows;
  }
  async addAllocation(record: AllocationRecord) {
    await this.db.query(
      `INSERT INTO season_allocations (id,tenant_id,campaign_id,organization_id,facility_id,resource_id,weekdays,starts_local,ends_local,reason,created_by,created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7::smallint[],$8,$9,$10,$11,$12)`,
      [
        record.id,
        record.tenantId,
        record.campaignId,
        record.organizationId,
        record.facilityId,
        record.resourceId,
        record.weekdays,
        record.startsLocal,
        record.endsLocal,
        record.reason,
        record.createdBy,
        record.createdAt.toString(),
      ],
    );
  }
  async addOccurrence(args: Parameters<SeasonRepository["addOccurrence"]>[0]) {
    const params = [
      args.tenantId,
      [...args.unitIds],
      args.start.toString(),
      args.end.toString(),
    ];
    // The caller holds the facility lock, so nothing can take the units between check and insert;
    // the exclusion constraint still backs this up.
    const { rows } = await this.db.query<{ bookingId: string | null }>(
      `SELECT u.booking_id AS "bookingId" FROM booking_units u
      WHERE u.tenant_id=$1 AND u.unit_id = ANY($2::uuid[]) AND u.starts_at<$4 AND u.ends_at>$3
      ORDER BY u.booking_id NULLS LAST LIMIT 1`,
      params,
    );
    const clash = rows[0];
    await this.db.query(
      "INSERT INTO season_occurrences (id,tenant_id,allocation_id,starts_at,ends_at,status,conflict_booking_id) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [
        args.id,
        args.tenantId,
        args.allocationId,
        args.start.toString(),
        args.end.toString(),
        clash ? "conflict" : "active",
        clash?.bookingId ?? null,
      ],
    );
    if (clash) return { conflict: true, bookingId: clash.bookingId };
    await this.db.query(
      "INSERT INTO booking_units (tenant_id,occurrence_id,unit_id,starts_at,ends_at) SELECT $1,$2,unit,$4,$5 FROM unnest($3::uuid[]) AS unit",
      [args.tenantId, args.id, ...params.slice(1)],
    );
    return { conflict: false, bookingId: null };
  }
  async findAllocation(tenantId: string, id: string) {
    const { rows } = await this.db.query<{
      id: string;
      cancelledAt: string | null;
    }>(
      'SELECT id, cancelled_at AS "cancelledAt" FROM season_allocations WHERE tenant_id=$1 AND id=$2 FOR UPDATE',
      [tenantId, id],
    );
    const row = rows[0];
    return row
      ? { id: row.id, cancelledAt: optionalInstant(row.cancelledAt) }
      : null;
  }
  async listAllocations(tenantId: string, campaignId: string) {
    const { rows } = await this.db.query<AllocationRow>(
      `${allocationSql} WHERE a.tenant_id=$1 AND a.campaign_id=$2 ORDER BY a.cancelled_at IS NOT NULL, f.name, r.name, a.starts_local`,
      [tenantId, campaignId],
    );
    return rows.map(allocation);
  }
  async getAllocation(tenantId: string, id: string) {
    const { rows } = await this.db.query<AllocationRow>(
      `${allocationSql} WHERE a.tenant_id=$1 AND a.id=$2`,
      [tenantId, id],
    );
    return rows[0] ? allocation(rows[0]) : null;
  }
  async cancelAllocation(
    args: Parameters<SeasonRepository["cancelAllocation"]>[0],
  ) {
    await this.db.query(
      "UPDATE season_allocations SET cancelled_at=$3, cancellation_reason=$4 WHERE tenant_id=$1 AND id=$2",
      [args.tenantId, args.id, args.at.toString(), args.reason],
    );
    const { rows } = await this.db.query<{ id: string }>(
      `UPDATE season_occurrences SET status='cancelled', cancellation_reason=$4
      WHERE tenant_id=$1 AND allocation_id=$2 AND status IN ('active','conflict') AND starts_at>$3 RETURNING id`,
      [args.tenantId, args.id, args.at.toString(), args.reason],
    );
    await this.db.query(
      "DELETE FROM booking_units WHERE tenant_id=$1 AND occurrence_id = ANY($2::uuid[])",
      [args.tenantId, rows.map((row) => row.id)],
    );
    return rows.length;
  }
  async findOccurrence(tenantId: string, id: string) {
    const { rows } = await this.db.query<{
      id: string;
      allocationId: string;
      status: "active" | "conflict" | "cancelled";
      start: string;
    }>(
      'SELECT id, allocation_id AS "allocationId", status, starts_at AS start FROM season_occurrences WHERE tenant_id=$1 AND id=$2 FOR UPDATE',
      [tenantId, id],
    );
    const row = rows[0];
    return row ? { ...row, start: instant(row.start) } : null;
  }
  async cancelOccurrence(tenantId: string, id: string, reason: string) {
    await this.db.query(
      "UPDATE season_occurrences SET status='cancelled', cancellation_reason=$3 WHERE tenant_id=$1 AND id=$2",
      [tenantId, id, reason],
    );
    await this.db.query(
      "DELETE FROM booking_units WHERE tenant_id=$1 AND occurrence_id=$2",
      [tenantId, id],
    );
  }
  async clubOf(tenantId: string, userId: string) {
    const { rows } = await this.db.query<{
      id: string;
      name: string;
      sport: Organization["sport"];
    }>(
      `SELECT o.id, o.name, o.sport FROM users u JOIN organizations o ON o.tenant_id=u.tenant_id AND o.id=u.organization_id
      WHERE u.tenant_id=$1 AND u.id=$2 AND u.deleted_at IS NULL`,
      [tenantId, userId],
    );
    return rows[0] ?? null;
  }
  async upcomingOccurrences(
    tenantId: string,
    organizationId: string,
    from: Temporal.Instant,
  ) {
    const { rows } = await this.db.query<
      Omit<ClubOccurrence, "start" | "end"> & { start: string; end: string }
    >(
      `SELECT s.id, f.name AS "facilityName", r.name AS "resourceName", s.starts_at AS start, s.ends_at AS "end"
      FROM season_occurrences s
      JOIN season_allocations a ON a.tenant_id=s.tenant_id AND a.id=s.allocation_id
      JOIN facilities f ON f.tenant_id=a.tenant_id AND f.id=a.facility_id
      JOIN resources r ON r.tenant_id=a.tenant_id AND r.id=a.resource_id
      WHERE s.tenant_id=$1 AND a.organization_id=$2 AND s.status='active' AND s.ends_at>$3
      ORDER BY s.starts_at LIMIT 20`,
      [tenantId, organizationId, from.toString()],
    );
    return rows.map((row) => ({
      ...row,
      start: instant(row.start),
      end: instant(row.end),
    }));
  }
  async sportExists(tenantId: string, code: string) {
    return Boolean(
      (
        await this.db.query(
          "SELECT 1 FROM sports WHERE tenant_id=$1 AND code=$2",
          [tenantId, code],
        )
      ).rowCount,
    );
  }
}
