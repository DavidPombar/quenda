// SPDX-License-Identifier: AGPL-3.0-or-later
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "pg";
import { databaseUrl } from "./config";
import { migrate } from "./migrate";
const FORMAT = "quenda-municipality-export";
const SUPPORTED_VERSIONS = [1, 2];
type Row = Record<string, unknown>;
export interface MunicipalityPackage {
  format: string;
  version: number;
  exportedAt: string;
  municipality: Row & { id: string; slug: string };
  facilities: Row[];
  accessKeys?: Row[];
  checkIns?: Row[];
  facilityPrices?: Row[];
  facilityStatusPeriods?: Row[];
  userCategories?: Row[];
  /** Courts and spaces (optional: packages from before courts get one per facility). */
  resources?: Row[];
  users: Row[];
  /** Identity provider links (optional in packages from before public identity). */
  identities?: Row[];
  bookings: Row[];
  notifications: Row[];
  auditEvents: Row[];
  consents: Row[];
  legalTexts: Row[];
  logos: Row[];
  bookingBlocks: Row[];
  notificationPreferences: Row[];
  messages: Row[];
  /** Season allocation to clubs (#17); optional in older packages. */
  organizations?: Row[];
  seasonCampaigns?: Row[];
  seasonAllocations?: Row[];
  seasonOccurrences?: Row[];
}
const collections = [
  "facilities",
  "users",
  "bookings",
  "notifications",
  "auditEvents",
] as const;
function parse(value: unknown): MunicipalityPackage {
  const data = value as Partial<MunicipalityPackage> | null;
  if (data?.format !== FORMAT) throw new Error(`Not a ${FORMAT} package`);
  if (!SUPPORTED_VERSIONS.includes(data.version as number))
    throw new Error(`Unsupported package version ${String(data.version)}`);
  if (typeof data.municipality?.id !== "string")
    throw new Error("The package has no municipality");
  for (const name of collections)
    if (!Array.isArray(data[name])) throw new Error(`Missing ${name}`);
  for (const name of [
    "consents",
    "legalTexts",
    "logos",
    "bookingBlocks",
    "notificationPreferences",
    "messages",
  ] as const) {
    if (data.version === 1) data[name] = [];
    if (!Array.isArray(data[name])) throw new Error(`Missing ${name}`);
  }
  return data as MunicipalityPackage;
}
// Column order of each table, mapped from the package's camelCase fields.
const tables = {
  municipalities: {
    id: "id",
    slug: "slug",
    name: "name",
    timezone: "timezone",
    locale: "locale",
    advance_days: "advanceDays",
    cancellation_hours: "cancellationHours",
    max_active_bookings: "maxActiveBookings",
    contact: "contact",
    legal_text: "legalText",
    legal_version: "legalVersion",
    retention_months: "retentionMonths",
    primary_color: "primaryColor",
    holidays_calendar: "holidaysCalendar",
    no_show_limit: "noShowLimit",
    no_show_window_days: "noShowWindowDays",
    no_show_block_days: "noShowBlockDays",
    reminder_hours: "reminderHours",
    mail_sender_name: "mailSenderName",
    mail_reply_to: "mailReplyTo",
    store_nif: "storeNif",
    enabled_categories: "enabledCategories",
    accessibility_unit: "accessibilityUnit",
    accessibility_email: "accessibilityEmail",
    accessibility_phone: "accessibilityPhone",
    accessibility_reviewed_on: "accessibilityReviewedOn",
    accessibility_method: "accessibilityMethod",
    accessibility_exceptions_gl: "accessibilityExceptionsGl",
    accessibility_exceptions_es: "accessibilityExceptionsEs",
    data_license: "dataLicense",
    dir3_code: "dir3Code",
    access_webhook_url: "accessWebhookUrl",
    access_webhook_secret_sealed: "accessWebhookSecretSealed",
  },
  facilities: {
    tenant_id: "tenantId",
    id: "id",
    name: "name",
    sport: "sport",
    address: "address",
    description: "description",
    accessible: "accessible",
    status: "status",
    slot_minutes: "slotMinutes",
    price_cents: "priceCents",
    opening_calendar: "openingCalendar",
    rules: "rules",
    follows_municipal_holidays: "followsMunicipalHolidays",
    latitude: "latitude",
    longitude: "longitude",
  },
  facility_status_periods: {
    tenant_id: "tenantId",
    facility_id: "facilityId",
    status: "status",
    starts_at: "start",
    ends_at: "end",
  },
  facility_prices: {
    tenant_id: "tenantId",
    facility_id: "facilityId",
    category: "category",
    price_cents: "priceCents",
  },
  user_categories: {
    tenant_id: "tenantId",
    user_id: "userId",
    category: "category",
    status: "status",
    requested_at: "requestedAt",
    decided_at: "decidedAt",
  },
  resources: {
    tenant_id: "tenantId",
    id: "id",
    facility_id: "facilityId",
    name: "name",
    position: "position",
    parent_id: "parentId",
    active: "active",
    created_at: "createdAt",
  },
  users: {
    tenant_id: "tenantId",
    id: "id",
    display_name: "displayName",
    role: "role",
    deleted_at: "deletedAt",
    email: "email",
    locale: "locale",
    assurance: "assurance",
    nif_ciphertext: "nifCiphertext",
    nif_digest: "nifDigest",
    prefers_family_tariff: "prefersFamilyTariff",
    organization_id: "organizationId",
  },
  identities: {
    tenant_id: "tenantId",
    id: "id",
    user_id: "userId",
    issuer: "issuer",
    subject: "subject",
    created_at: "createdAt",
  },
  bookings: {
    tenant_id: "tenantId",
    id: "id",
    user_id: "userId",
    facility_id: "facilityId",
    resource_id: "resourceId",
    starts_at: "start",
    ends_at: "end",
    status: "status",
    created_at: "createdAt",
    cancelled_at: "cancelledAt",
    cancellation_hours: "cancellationHours",
    cancelled_by: "cancelledBy",
    cancellation_reason: "cancellationReason",
    sequence: "sequence",
    tariff_category: "tariffCategory",
    price_cents: "priceCents",
  },
  notifications: {
    tenant_id: "tenantId",
    id: "id",
    user_id: "userId",
    booking_id: "bookingId",
    kind: "kind",
    created_at: "createdAt",
    details: "details",
    dedupe_key: "dedupeKey",
  },
  audit_events: {
    tenant_id: "tenantId",
    id: "id",
    actor_id: "actorId",
    action: "action",
    resource_id: "resourceId",
    occurred_at: "occurredAt",
    actor_role: "actorRole",
    details: "details",
  },
  consents: {
    tenant_id: "tenantId",
    id: "id",
    user_id: "userId",
    legal_version: "legalVersion",
    accepted_at: "acceptedAt",
  },
  legal_texts: {
    tenant_id: "tenantId",
    version: "version",
    text_gl: "textGl",
    text_es: "textEs",
    published_at: "publishedAt",
  },
  municipality_logos: {
    tenant_id: "tenantId",
    content_type: "contentType",
    data: "data",
    sha256: "sha256",
    updated_at: "updatedAt",
  },
  booking_blocks: {
    tenant_id: "tenantId",
    id: "id",
    user_id: "userId",
    booking_id: "bookingId",
    starts_at: "start",
    ends_at: "end",
    lifted_at: "liftedAt",
  },
  notification_preferences: {
    tenant_id: "tenantId",
    user_id: "userId",
    kind: "kind",
    channel: "channel",
    enabled: "enabled",
    updated_at: "updatedAt",
  },
  access_keys: {
    tenant_id: "tenantId",
    kid: "kid",
    public_jwk: "publicJwk",
    private_key_sealed: "privateKeySealed",
    created_at: "createdAt",
    retired_at: "retiredAt",
  },
  check_ins: {
    tenant_id: "tenantId",
    id: "id",
    booking_id: "bookingId",
    booking_sequence: "sequence",
    actor_id: "actorId",
    method: "method",
    checked_in_at: "checkedInAt",
    recorded_at: "recordedAt",
  },
  organizations: {
    tenant_id: "tenantId",
    id: "id",
    name: "name",
    tax_id: "taxId",
    sport: "sport",
    contact_email: "contactEmail",
    created_at: "createdAt",
    archived_at: "archivedAt",
  },
  season_campaigns: {
    tenant_id: "tenantId",
    id: "id",
    name: "name",
    starts_on: "startsOn",
    ends_on: "endsOn",
    criteria_gl: "criteriaGl",
    criteria_es: "criteriaEs",
    created_at: "createdAt",
  },
  season_campaign_facilities: {
    tenant_id: "tenantId",
    campaign_id: "campaignId",
    facility_id: "facilityId",
  },
  season_allocations: {
    tenant_id: "tenantId",
    id: "id",
    campaign_id: "campaignId",
    organization_id: "organizationId",
    facility_id: "facilityId",
    resource_id: "resourceId",
    weekdays: "weekdays",
    starts_local: "startsLocal",
    ends_local: "endsLocal",
    reason: "reason",
    created_by: "createdBy",
    created_at: "createdAt",
    cancelled_at: "cancelledAt",
    cancellation_reason: "cancellationReason",
  },
  season_occurrences: {
    tenant_id: "tenantId",
    id: "id",
    allocation_id: "allocationId",
    starts_at: "start",
    ends_at: "end",
    status: "status",
    conflict_booking_id: "conflictBookingId",
    cancellation_reason: "cancellationReason",
  },
  outbox: {
    tenant_id: "tenantId",
    id: "id",
    user_id: "userId",
    booking_id: "bookingId",
    kind: "kind",
    channel: "channel",
    dedupe_key: "dedupeKey",
    created_at: "createdAt",
    available_at: "availableAt",
    attempts: "attempts",
    locked_until: "lockedUntil",
    sent_at: "sentAt",
    last_error: "lastError",
  },
} as const;
/**
 * Loads a municipality export into this instance in one transaction (criterion 4,
 * T3, R3). Identifiers are kept: they are UUIDs and stay unique across instances.
 */
export async function importMunicipality(
  input: unknown,
  options: { url?: string; slug?: string } = {},
) {
  const data = parse(input);
  const url = options.url ?? databaseUrl;
  await migrate(url, () => undefined);
  const tenantId = data.municipality.id;
  const slug = options.slug ?? data.municipality.slug;
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query<{ id: string; slug: string }>(
      "SELECT id, slug FROM municipalities WHERE slug=$1 OR id=$2",
      [slug, tenantId],
    );
    if (existing.rows.some((row) => row.slug === slug))
      throw new Error(
        `Municipality slug "${slug}" already exists; choose another with --slug`,
      );
    if (existing.rows.length)
      throw new Error(
        `Municipality ${tenantId} already exists in this instance`,
      );
    async function insert(table: keyof typeof tables, rows: readonly Row[]) {
      for (const row of rows) {
        const columns = Object.entries(tables[table]).filter(
          ([, field]) => field === "tenantId" || row[field] !== undefined,
        );
        await client.query(
          `INSERT INTO ${table} (${columns.map(([column]) => column).join(",")}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(",")})`,
          columns.map(([, field]) =>
            field === "tenantId"
              ? tenantId
              : table === "municipality_logos" && field === "data"
                ? Buffer.from(String(row[field]), "base64")
                : (row[field] ?? null),
          ),
        );
      }
    }
    await insert("municipalities", [{ ...data.municipality, slug }]);
    // Clubs come before the accounts that represent them.
    await insert("organizations", data.organizations ?? []);
    await insert("users", data.users);
    await insert("identities", data.identities ?? []);
    await insert("facilities", data.facilities);
    await insert("facility_status_periods", data.facilityStatusPeriods ?? []);
    await insert("facility_prices", data.facilityPrices ?? []);
    await insert("user_categories", data.userCategories ?? []);
    // Parents come before their parts; packages without courts get the default one per
    // facility, with the facility's id, exactly as the courts migration does.
    await insert("resources", data.resources ?? []);
    await client.query(
      `INSERT INTO resources (id, tenant_id, facility_id, name, position, parent_id, active)
      SELECT f.id, f.tenant_id, f.id, f.name, 0, NULL, true FROM facilities f
      WHERE f.tenant_id=$1 AND NOT EXISTS (
        SELECT 1 FROM resources r WHERE r.tenant_id=f.tenant_id AND r.facility_id=f.id
      )`,
      [tenantId],
    );
    await insert(
      "bookings",
      data.bookings.map((row) => ({
        ...row,
        resourceId: row.resourceId ?? row.facilityId,
      })),
    );
    await insert("access_keys", data.accessKeys ?? []);
    await insert("check_ins", data.checkIns ?? []);
    // Occupied units are derived data: the booked resource, or every part of a whole court.
    await client.query(
      `INSERT INTO booking_units (tenant_id, booking_id, unit_id, starts_at, ends_at)
      SELECT b.tenant_id, b.id, coalesce(part.id, r.id), b.starts_at, b.ends_at
      FROM bookings b
      JOIN resources r ON r.tenant_id=b.tenant_id AND r.id=b.resource_id
      LEFT JOIN resources part ON part.tenant_id=r.tenant_id AND part.parent_id=r.id
      WHERE b.tenant_id=$1 AND b.status IN ('confirmed', 'no_show')`,
      [tenantId],
    );
    await insert("season_campaigns", data.seasonCampaigns ?? []);
    await insert(
      "season_campaign_facilities",
      (data.seasonCampaigns ?? []).flatMap((campaign) =>
        (campaign.facilityIds as string[]).map((facilityId) => ({
          campaignId: campaign.id,
          facilityId,
        })),
      ),
    );
    await insert("season_allocations", data.seasonAllocations ?? []);
    await insert("season_occurrences", data.seasonOccurrences ?? []);
    // Active club dates occupy their units like bookings: the court, or every part of it.
    await client.query(
      `INSERT INTO booking_units (tenant_id, occurrence_id, unit_id, starts_at, ends_at)
      SELECT s.tenant_id, s.id, coalesce(part.id, r.id), s.starts_at, s.ends_at
      FROM season_occurrences s
      JOIN season_allocations a ON a.tenant_id=s.tenant_id AND a.id=s.allocation_id
      JOIN resources r ON r.tenant_id=a.tenant_id AND r.id=a.resource_id
      LEFT JOIN resources part ON part.tenant_id=r.tenant_id AND part.parent_id=r.id
      WHERE s.tenant_id=$1 AND s.status='active'`,
      [tenantId],
    );
    await insert("notifications", data.notifications);
    await insert("audit_events", data.auditEvents);
    await insert("consents", data.consents);
    await insert("legal_texts", data.legalTexts);
    await insert("municipality_logos", data.logos);
    await insert("booking_blocks", data.bookingBlocks);
    await insert("notification_preferences", data.notificationPreferences);
    await insert("outbox", data.messages);
    if (data.version === 1) {
      await client.query(
        "INSERT INTO legal_texts (tenant_id,version,text_gl,text_es,published_at) SELECT id,legal_version,legal_text,legal_text,now() FROM municipalities WHERE id=$1 ON CONFLICT DO NOTHING",
        [tenantId],
      );
    }
    await client.query("COMMIT");
    return { id: tenantId, slug };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
async function main(args: string[]) {
  const slugAt = args.indexOf("--slug");
  const slug = slugAt >= 0 ? args[slugAt + 1] : undefined;
  const file = args.find(
    (arg, i) => !arg.startsWith("--") && (slugAt < 0 || i !== slugAt + 1),
  );
  if (!file || (slugAt >= 0 && !slug))
    throw new Error(
      "Usage: npm run db:import -- <file.json> [--slug new-slug]",
    );
  const imported = await importMunicipality(
    // npm runs workspace scripts from the workspace; resolve from where it was invoked.
    JSON.parse(
      await readFile(
        resolve(process.env.INIT_CWD ?? process.cwd(), file),
        "utf8",
      ),
    ),
    { slug },
  );
  console.log(`Imported municipality ${imported.slug} (${imported.id})`);
}
if (require.main === module)
  void main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
