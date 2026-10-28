// SPDX-License-Identifier: AGPL-3.0-or-later
import type { OpenFacility } from "./open-facility.read-model";
export abstract class OpenDataRepository {
  /** Every facility of the municipality, ordered by name. */
  abstract facilities(tenantId: string): Promise<OpenFacility[]>;
}
