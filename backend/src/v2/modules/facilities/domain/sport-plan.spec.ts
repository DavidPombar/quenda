// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { planSports, type SportDraft } from "./sport-plan";
const sport = (
  code: string,
  overrides: Partial<SportDraft> = {},
): SportDraft => ({
  code,
  nameGl: `${code} gl`,
  nameEs: `${code} es`,
  cnidClass: "Pistas",
  cnidType: "Pista polideportiva",
  schemaType: "SportsActivityLocation",
  art: "generic",
  visible: true,
  ...overrides,
});
const current = [sport("padel"), sport("tennis")].map((value, position) => ({
  ...value,
  position,
}));
describe("Sport plan", () => {
  it("should keep the requested order, trim names and list removed sports", () => {
    const result = planSports(
      current,
      [sport("chess", { nameGl: " Xadrez " }), sport("padel")],
      [],
    );
    expect(result).toMatchObject({
      plan: {
        save: [
          { code: "chess", nameGl: "Xadrez", position: 0 },
          { code: "padel", position: 1 },
        ],
        remove: ["tennis"],
      },
    });
  });
  it("should reject invalid codes, blank or repeated names and a catalogue without visible sports", () => {
    for (const requested of [
      [],
      [sport("Pádel")],
      [sport("x")],
      [sport("padel", { nameGl: " " })],
      [sport("padel"), sport("tennis", { nameEs: "PADEL ES" })],
      [sport("padel"), sport("padel")],
      [sport("padel", { visible: false })],
      [sport("padel", { schemaType: "not a type" })],
    ])
      expect(planSports(current, requested, [])).toEqual({
        error: { code: "validation" },
      });
  });
  it("should refuse to remove a sport used by a facility but allow hiding it", () => {
    expect(planSports(current, [sport("padel")], ["tennis"])).toEqual({
      error: { code: "sport_in_use", sportCode: "tennis" },
    });
    expect(
      planSports(
        current,
        [sport("padel"), sport("tennis", { visible: false })],
        ["tennis"],
      ),
    ).toHaveProperty("plan");
  });
});
