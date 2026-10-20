// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { ConsentRecord } from "./account.read-model";
export abstract class ConsentRepository {
  abstract add(args: {
    id: string;
    tenantId: string;
    userId: string;
    legalVersion: string;
    acceptedAt: Temporal.Instant;
  }): Promise<void>;
  /** Most recent acceptance first. */
  abstract listByUser(
    tenantId: string,
    userId: string,
  ): Promise<ConsentRecord[]>;
}
