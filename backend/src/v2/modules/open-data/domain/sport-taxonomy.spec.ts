// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { sportTaxonomy } from "./sport-taxonomy";
describe("Sport taxonomy", () => {
  test("should classify every sport with a CNID type and a schema.org type", () => {
    for (const sport of ["padel", "tennis", "futsal", "swimming"] as const) {
      expect(sportTaxonomy[sport].cnidType).not.toBe("");
      expect(sportTaxonomy[sport].schemaType).toMatch(/^[A-Z][A-Za-z]+$/);
    }
  });
});
