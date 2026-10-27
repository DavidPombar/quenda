// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHmac } from "node:crypto";
/**
 * Standard Webhooks signature (https://www.standardwebhooks.com): HMAC-SHA256 over
 * "{webhook-id}.{webhook-timestamp}.{body}" with the base64 bytes after "whsec_".
 */
export function webhookSignature(args: {
  secret: string;
  id: string;
  timestamp: number;
  body: string;
}) {
  const key = Buffer.from(args.secret.replace(/^whsec_/, ""), "base64");
  return `v1,${createHmac("sha256", key)
    .update(`${args.id}.${args.timestamp}.${args.body}`)
    .digest("base64")}`;
}
