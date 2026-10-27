// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Facility } from "./facility.entity";
import type { Temporal } from "@js-temporal/polyfill";
import type { Result } from "../../../shared/application/result";
import type { AppError } from "../../../shared/application/errors";
export interface CatalogFilters {
  q?: string;
  sport?: Facility["sport"];
  accessible?: boolean;
  /** Municipality slugs; empty means every municipality of the deployment. */
  municipalities: string[];
}
export interface CatalogEntry extends Omit<
  Facility,
  "tenantId" | "openingCalendar" | "rules" | "followsMunicipalHolidays"
> {
  municipality: { slug: string; name: string };
}
export const CATALOG_LIMIT = 200;
export abstract class FacilityRepository {
  /** Public, cross-municipality read of active facilities (R3, #18). */
  abstract catalog(filters: CatalogFilters): Promise<CatalogEntry[]>;
  abstract list(tenantId: string): Promise<Facility[]>;
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
  abstract hasFutureBookings(
    tenantId: string,
    id: string,
    now: Temporal.Instant,
  ): Promise<boolean>;
  abstract busy(
    tenantId: string,
    id: string,
    dateStart: Temporal.Instant,
    dateEnd: Temporal.Instant,
  ): Promise<{ start: Temporal.Instant; end: Temporal.Instant }[]>;
}
