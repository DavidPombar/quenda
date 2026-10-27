// SPDX-License-Identifier: AGPL-3.0-or-later
export interface AccessWebhookSettings {
  url: string | null;
  hasSecret: boolean;
}
/** Where reservation changes are announced; the HMAC secret is stored encrypted. */
export abstract class AccessWebhookRepository {
  abstract find(tenantId: string): Promise<AccessWebhookSettings>;
  /** Returns the new secret, shown once, when `newSecret` asks for one. */
  abstract save(args: {
    tenantId: string;
    url: string | null;
    newSecret: boolean;
  }): Promise<string | null>;
}
