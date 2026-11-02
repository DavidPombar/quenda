// SPDX-License-Identifier: AGPL-3.0-or-later
import type { OpenFacility } from "./open-facility.read-model";
import type { OpenActivity } from "./open-activity.read-model";
export abstract class OpenDataRepository {
  /** Every facility of the municipality, ordered by name. */
  abstract facilities(tenantId: string): Promise<OpenFacility[]>;
  /** Published activities that have not ended on the local date `today`, by first day and name (#97). */
  abstract activities(
    tenantId: string,
    today: string,
  ): Promise<OpenActivity[]>;
}
