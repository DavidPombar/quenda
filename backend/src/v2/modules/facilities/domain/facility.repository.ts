// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Facility } from "./facility.entity";
import type { Temporal } from "@js-temporal/polyfill";
import type { Result } from "../../../shared/application/result";
import type { AppError } from "../../../shared/application/errors";
export abstract class FacilityRepository {
  abstract list(tenantId: string): Promise<Facility[]>;
  abstract find(
    tenantId: string,
    id: string,
    lock?: boolean,
  ): Promise<Facility | null>;
  abstract save(
    facility: Facility,
  ): Promise<Result<void, AppError<"id_reused">>>;
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
