// SPDX-License-Identifier: AGPL-3.0-or-later
import { randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { AccessWebhookRepository } from "../../domain/access-webhook.repository";
import { Database } from "../../../../shared/infrastructure/database";
import { seal } from "../crypto/key-encryption";
@Injectable()
export class PostgresAccessWebhookRepository extends AccessWebhookRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async find(tenantId: string) {
    const row = (
      await this.db.query<{ url: string | null; has_secret: boolean }>(
        "SELECT access_webhook_url AS url, access_webhook_secret IS NOT NULL AS has_secret FROM municipalities WHERE id=$1",
        [tenantId],
      )
    ).rows[0];
    return { url: row?.url ?? null, hasSecret: row?.has_secret ?? false };
  }
  async save(args: {
    tenantId: string;
    url: string | null;
    newSecret: boolean;
  }) {
    // Standard Webhooks secret format: "whsec_" and base64 of 32 random bytes.
    const secret = args.newSecret
      ? `whsec_${randomBytes(32).toString("base64")}`
      : null;
    await this.db.query(
      "UPDATE municipalities SET access_webhook_url=$2, access_webhook_secret=COALESCE($3, access_webhook_secret) WHERE id=$1",
      [
        args.tenantId,
        args.url,
        secret === null
          ? null
          : seal(Buffer.from(secret), `webhook:${args.tenantId}`),
      ],
    );
    return secret;
  }
}
