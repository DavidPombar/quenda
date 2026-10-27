// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import {
  UnsubscribeTarget,
  UnsubscribeTokens,
} from "../application/unsubscribe-tokens";
const UUID = /^[0-9a-f-]{36}$/;
@Injectable()
export class HmacUnsubscribeTokens extends UnsubscribeTokens {
  private readonly secret: string;
  constructor() {
    super();
    const configured = process.env.UNSUBSCRIBE_SECRET;
    if (configured) this.secret = configured;
    else if (process.env.DEMO_MODE === "true")
      this.secret = "quenda-demo-unsubscribe-secret";
    else {
      // Links stop working after a restart; deployments must set UNSUBSCRIBE_SECRET.
      new Logger(HmacUnsubscribeTokens.name).warn(
        "UNSUBSCRIBE_SECRET is not set; using a temporary secret",
      );
      this.secret = randomBytes(32).toString("hex");
    }
  }
  sign(target: UnsubscribeTarget) {
    const payload = Buffer.from(
      [target.tenantId, target.userId, target.kind, target.channel].join("."),
    ).toString("base64url");
    return `${payload}.${this.mac(payload)}`;
  }
  verify(token: string): UnsubscribeTarget | null {
    const [payload, mac, ...rest] = token.split(".");
    if (!payload || !mac || rest.length) return null;
    const expected = Buffer.from(this.mac(payload));
    const given = Buffer.from(mac);
    if (expected.length !== given.length || !timingSafeEqual(expected, given))
      return null;
    const [tenantId, userId, kind, channel] = Buffer.from(payload, "base64url")
      .toString()
      .split(".");
    if (!UUID.test(tenantId ?? "") || !UUID.test(userId ?? "")) return null;
    if (kind !== "reminder" || channel !== "email") return null;
    return { tenantId, userId, kind, channel };
  }
  private mac(payload: string) {
    return createHmac("sha256", this.secret)
      .update(payload)
      .digest("base64url");
  }
}
