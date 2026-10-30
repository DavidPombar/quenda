// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type {
  Allocation,
  Campaign,
  ClubOccurrence,
  Organization,
} from "./season.read-model";
export interface OrganizationRecord {
  id: string;
  tenantId: string;
  name: string;
  taxId: string | null;
  sport: Organization["sport"];
  contactEmail: string | null;
  createdAt: Temporal.Instant;
  archivedAt: Temporal.Instant | null;
}
export interface CampaignRecord {
  id: string;
  tenantId: string;
  name: string;
  startsOn: string;
  endsOn: string;
  criteriaGl: string;
  criteriaEs: string;
  facilityIds: string[];
  createdAt: Temporal.Instant;
}
export interface AllocationRecord {
  id: string;
  tenantId: string;
  campaignId: string;
  organizationId: string;
  facilityId: string;
  resourceId: string;
  weekdays: number[];
  startsLocal: string;
  endsLocal: string;
  reason: string;
  createdBy: string;
  createdAt: Temporal.Instant;
}
export interface SlotResource {
  id: string;
  parentId: string | null;
  active: boolean;
}
export abstract class SeasonRepository {
  abstract listOrganizations(tenantId: string): Promise<Organization[]>;
  abstract findOrganization(
    tenantId: string,
    id: string,
  ): Promise<OrganizationRecord | null>;
  abstract saveOrganization(record: OrganizationRecord): Promise<void>;
  /** A live citizen account of the municipality with that address, compared case-insensitively. */
  abstract findCitizenByEmail(
    tenantId: string,
    email: string,
  ): Promise<{ userId: string; organizationId: string | null } | null>;
  abstract setRepresentative(
    tenantId: string,
    userId: string,
    organizationId: string | null,
  ): Promise<void>;
  /** Returns false when the person did not represent that organization. */
  abstract removeRepresentative(
    tenantId: string,
    organizationId: string,
    userId: string,
  ): Promise<boolean>;
  abstract listCampaigns(tenantId: string): Promise<Campaign[]>;
  /** Campaigns that have not ended on `today`, for the published criteria. */
  abstract currentCampaigns(
    tenantId: string,
    today: string,
  ): Promise<Campaign[]>;
  abstract findCampaign(
    tenantId: string,
    id: string,
  ): Promise<CampaignRecord | null>;
  abstract saveCampaign(record: CampaignRecord): Promise<void>;
  /** Existing facilities of the municipality among `ids`. */
  abstract existingFacilities(
    tenantId: string,
    ids: readonly string[],
  ): Promise<string[]>;
  /** Locks the facility row, serialising with one-off bookings and schedule edits. */
  abstract lockFacility(tenantId: string, facilityId: string): Promise<boolean>;
  abstract resources(
    tenantId: string,
    facilityId: string,
  ): Promise<SlotResource[]>;
  abstract addAllocation(record: AllocationRecord): Promise<void>;
  /**
   * Stores a dated occurrence and occupies its units. When the units are already taken it is stored
   * as a conflict instead, with the one-off booking it clashes with (null for another club).
   */
  abstract addOccurrence(args: {
    id: string;
    tenantId: string;
    allocationId: string;
    unitIds: readonly string[];
    start: Temporal.Instant;
    end: Temporal.Instant;
  }): Promise<{ conflict: boolean; bookingId: string | null }>;
  abstract findAllocation(
    tenantId: string,
    id: string,
  ): Promise<{ id: string; cancelledAt: Temporal.Instant | null } | null>;
  abstract listAllocations(
    tenantId: string,
    campaignId: string,
  ): Promise<Allocation[]>;
  abstract getAllocation(
    tenantId: string,
    id: string,
  ): Promise<Allocation | null>;
  /** Cancels the allocation and frees its occurrences that have not started. Returns how many. */
  abstract cancelAllocation(args: {
    tenantId: string;
    id: string;
    reason: string;
    at: Temporal.Instant;
  }): Promise<number>;
  abstract findOccurrence(
    tenantId: string,
    id: string,
  ): Promise<{
    id: string;
    allocationId: string;
    status: "active" | "conflict" | "cancelled";
    start: Temporal.Instant;
  } | null>;
  /** Marks one date as cancelled and frees its units. */
  abstract cancelOccurrence(
    tenantId: string,
    id: string,
    reason: string,
  ): Promise<void>;
  abstract clubOf(
    tenantId: string,
    userId: string,
  ): Promise<{ id: string; name: string; sport: Organization["sport"] } | null>;
  abstract upcomingOccurrences(
    tenantId: string,
    organizationId: string,
    from: Temporal.Instant,
  ): Promise<ClubOccurrence[]>;
  /** Whether the code is a visible sport of the municipality's catalogue (#26). */
  abstract sportExists(tenantId: string, code: string): Promise<boolean>;
}
