// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import {
  checkWindow,
  credentialWindow,
  toEpochSeconds,
} from "./access-credential";
const at = (value: string) => Temporal.Instant.from(value);
describe("access credential window", () => {
  it("should open with the space's first opening that day and close when the booking ends", () => {
    expect(
      credentialWindow({
        start: at("2026-10-27T17:00:00Z"),
        end: at("2026-10-27T18:30:00Z"),
        openings: [
          { start: at("2026-10-27T15:00:00Z") },
          { start: at("2026-10-27T08:00:00Z") },
        ],
      }),
    ).toEqual({
      notBefore: at("2026-10-27T08:00:00Z"),
      expiresAt: at("2026-10-27T18:30:00Z"),
    });
  });
  it("should open with the booking itself when no opening precedes it", () => {
    expect(
      credentialWindow({
        start: at("2026-10-27T07:00:00Z"),
        end: at("2026-10-27T08:00:00Z"),
        openings: [{ start: at("2026-10-27T08:00:00Z") }],
      }).notBefore,
    ).toEqual(at("2026-10-27T07:00:00Z"));
  });
  it("should accept scans from nbf inclusive to exp exclusive", () => {
    const claims = {
      nbf: toEpochSeconds(at("2026-10-27T08:00:00Z")),
      exp: toEpochSeconds(at("2026-10-27T18:30:00Z")),
    };
    expect(checkWindow(claims, at("2026-10-27T07:59:59Z"))).toBe(
      "not_yet_valid",
    );
    expect(checkWindow(claims, at("2026-10-27T08:00:00Z"))).toBe("valid");
    expect(checkWindow(claims, at("2026-10-27T18:29:59Z"))).toBe("valid");
    expect(checkWindow(claims, at("2026-10-27T18:30:00Z"))).toBe("expired");
  });
});
