// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHmac, randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HmacUnsubscribeTokens } from "./hmac-unsubscribe-tokens";
const secret = "unit-test-unsubscribe-secret";
const target = {
  tenantId: randomUUID(),
  userId: randomUUID(),
  channel: "email" as const,
};
/** A link in the format sent before notices had versions: reminder only. */
function legacy(kind: string) {
  const payload = Buffer.from(
    [target.tenantId, target.userId, kind, "email"].join("."),
  ).toString("base64url");
  const mac = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}
describe("HmacUnsubscribeTokens", () => {
  beforeEach(() => {
    process.env.UNSUBSCRIBE_SECRET = secret;
  });
  afterEach(() => {
    delete process.env.UNSUBSCRIBE_SECRET;
  });
  it("should round-trip any notice with the preference version it was signed at", () => {
    const tokens = new HmacUnsubscribeTokens();
    const token = tokens.sign({ ...target, kind: "penalty", version: "0" });
    expect(tokens.verify(token)).toEqual({
      ...target,
      kind: "penalty",
      version: "0",
    });
    expect(tokens.verify(`${token.slice(0, -2)}xx`)).toBeNull();
  });
  it("should still accept reminder links sent before versions existed, and nothing else in that format", () => {
    const tokens = new HmacUnsubscribeTokens();
    expect(tokens.verify(legacy("reminder"))).toEqual({
      ...target,
      kind: "reminder",
      version: null,
    });
    expect(tokens.verify(legacy("confirmation"))).toBeNull();
    expect(tokens.verify(legacy("unknown"))).toBeNull();
  });
});
