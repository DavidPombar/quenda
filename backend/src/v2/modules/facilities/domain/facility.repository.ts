// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Facility } from "./facility.entity";
import type { Temporal } from "@js-temporal/polyfill";
import type { Result } from "../../../shared/application/result";
import type { AppError } from "../../../shared/application/errors";
export interface FacilityFilters {
  q?: string;
  sport?: string;
  accessible?: boolean;
  /** Leaves out closed facilities; maintenance ones still show, marked. */
  hideClosed?: boolean;
}
export interface CatalogFilters extends FacilityFilters {
  /** Municipality slugs; empty means every municipality of the deployment. */
  municipalities: string[];
}
export interface PageRequest {
  /** 1-based page number. */
  page: number;
  size: number;
}
export interface Page<T> {
  items: T[];
  total: number;
}
export interface CatalogEntry extends Omit<
  Facility,
  | "tenantId"
  | "openingCalendar"
  | "rules"
  | "followsMunicipalHolidays"
  | "prices"
> {
  municipality: { slug: string; name: string };
  sportName: { gl: string; es: string };
  /** First photo of the facility, for the card. */
  photo: {
    id: string;
    version: string;
    alt: { gl: string; es: string };
  } | null;
}
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;
export interface UpcomingBooking {
  id: string;
  userId: string;
  start: Temporal.Instant;
  end: Temporal.Instant;
}
export abstract class FacilityRepository {
  /** Public, cross-municipality read of active facilities (R3, #18). */
  abstract catalog(
    filters: CatalogFilters,
    page: PageRequest,
  ): Promise<Page<CatalogEntry>>;
  abstract list(tenantId: string): Promise<Facility[]>;
  /**
   * One page of the municipality's facilities (#26): active first, then in maintenance, then
   * closed, by name within each group.
   */
  abstract search(
    tenantId: string,
    filters: FacilityFilters,
    page: PageRequest,
  ): Promise<Page<Facility>>;
  abstract find(
    tenantId: string,
    id: string,
    lock?: boolean,
  ): Promise<Facility | null>;
  abstract save(
    facility: Facility,
  ): Promise<Result<void, AppError<"id_reused">>>;
  /** Closes the open status period and opens one with `status` from `at`. */
  abstract recordStatus(
    tenantId: string,
    id: string,
    status: Facility["status"],
    at: Temporal.Instant,
  ): Promise<void>;
  /** Confirmed bookings of people that have not ended yet. */
  abstract upcomingBookings(
    tenantId: string,
    id: string,
    now: Temporal.Instant,
  ): Promise<UpcomingBooking[]>;
  /** Cancels bookings on behalf of the municipality and adds one notice per booking. */
  abstract cancelBookings(args: {
    tenantId: string;
    bookings: readonly { id: string; userId: string; notificationId: string }[];
    reason: string;
    at: Temporal.Instant;
  }): Promise<void>;
  /**
   * Occupied units of the facility's resources overlapping the interval; `season` marks units held
   * by a club's season slot (#17) rather than a one-off booking.
   */
  abstract busy(
    tenantId: string,
    id: string,
    dateStart: Temporal.Instant,
    dateEnd: Temporal.Instant,
  ): Promise<
    {
      unitId: string;
      start: Temporal.Instant;
      end: Temporal.Instant;
      season: boolean;
    }[]
  >;
}
