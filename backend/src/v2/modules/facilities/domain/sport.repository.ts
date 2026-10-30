// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Sport } from "./sport.entity";
import type { SportPlan } from "./sport-plan";
import type { Result } from "../../../shared/application/result";
import type { AppError } from "../../../shared/application/errors";
export abstract class SportRepository {
  /** Locks the municipality's catalogue; false when the municipality does not exist. */
  abstract lock(tenantId: string): Promise<boolean>;
  /** The municipality's catalogue in order; hidden sports only when asked for. */
  abstract list(tenantId: string, includeHidden: boolean): Promise<Sport[]>;
  /** Visible sports with at least one facility, one per code, as filters for the catalogue. */
  abstract listShared(slugs: readonly string[]): Promise<Sport[]>;
  abstract find(tenantId: string, code: string): Promise<Sport | null>;
  /** Codes used by at least one facility of the municipality. */
  abstract usedCodes(tenantId: string): Promise<string[]>;
  abstract apply(
    tenantId: string,
    plan: SportPlan,
  ): Promise<Result<void, AppError<"sport_in_use">>>;
}
