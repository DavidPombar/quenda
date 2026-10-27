// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { AccessKey, AccessKeyRecord } from "./access.read-model";
export abstract class AccessKeyRepository {
  abstract active(tenantId: string): Promise<AccessKeyRecord | null>;
  /** The active key and keys retired after `since`, newest first. */
  abstract published(
    tenantId: string,
    since: Temporal.Instant,
  ): Promise<AccessKey[]>;
  abstract all(tenantId: string): Promise<AccessKey[]>;
  abstract insert(tenantId: string, key: AccessKeyRecord): Promise<void>;
  abstract retireActive(tenantId: string, at: Temporal.Instant): Promise<void>;
}
