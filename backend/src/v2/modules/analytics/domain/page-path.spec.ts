// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { pagePath } from "./page-path";
describe("pagePath", () => {
  it("should drop the query string and fragment, which can carry tokens", () => {
    expect(pagePath("/app/vilaverde/baixa?token=secret#top")).toBe(
      "/app/vilaverde/baixa",
    );
  });
  it("should replace identifiers so no facility or reservation is singled out", () => {
    expect(
      pagePath(
        "/app/vilaverde/instalacions/20000000-0000-4000-8000-000000000011",
      ),
    ).toBe("/app/vilaverde/instalacions/:id");
  });
  it("should reject anything that is not a plain path", () => {
    expect(pagePath("https://example.org/app")).toBeNull();
    expect(pagePath("//example.org/app")).toBeNull();
    expect(pagePath("/app/<script>")).toBeNull();
    expect(pagePath(`/${"a".repeat(300)}`)).toBeNull();
  });
});
