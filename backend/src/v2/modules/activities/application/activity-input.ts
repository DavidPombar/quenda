// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
import type {
  ActivityPrice,
  LocalizedText,
  WeeklyRule,
} from "../domain/activity.entity";
import { isValidRule, normaliseRule } from "../domain/activity-schedule";
import type { Category } from "../../../shared/application/categories";
/** What the manager edits; the facility and court are checked against the municipality later. */
export interface ActivityInput {
  facilityId: string;
  resourceId: string;
  sport: string;
  name: LocalizedText;
  description: LocalizedText;
  rule: WeeklyRule;
  places: number;
  minAge: number | null;
  maxAge: number | null;
  enrolmentOpensOn: string;
  enrolmentClosesOn: string;
  prices: ActivityPrice[];
}
const date = (value: string) => Temporal.PlainDate.from(value);
/**
 * Trimmed and normalised input, or null when it is incoherent: names, ages, places, the weekly
 * rule, an enrolment period that closes by the last day, and prices only for the general tariff
 * and the categories the municipality uses.
 */
export function cleanActivityInput(
  input: ActivityInput,
  enabledCategories: readonly Category[],
): ActivityInput | null {
  const name = { gl: input.name.gl.trim(), es: input.name.es.trim() };
  const description = {
    gl: input.description.gl.trim(),
    es: input.description.es.trim(),
  };
  if (
    name.gl.length < 2 ||
    name.gl.length > 120 ||
    name.es.length > 120 ||
    description.gl.length > 2000 ||
    description.es.length > 2000 ||
    !Number.isInteger(input.places) ||
    input.places < 1 ||
    input.places > 500 ||
    !isValidRule(input.rule)
  )
    return null;
  for (const age of [input.minAge, input.maxAge])
    if (age !== null && (!Number.isInteger(age) || age < 0 || age > 120))
      return null;
  if (
    input.minAge !== null &&
    input.maxAge !== null &&
    input.minAge > input.maxAge
  )
    return null;
  const rule = normaliseRule(input.rule);
  let opens: Temporal.PlainDate;
  let closes: Temporal.PlainDate;
  try {
    opens = date(input.enrolmentOpensOn);
    closes = date(input.enrolmentClosesOn);
  } catch {
    return null;
  }
  if (
    Temporal.PlainDate.compare(opens, closes) > 0 ||
    Temporal.PlainDate.compare(closes, date(rule.endsOn)) > 0
  )
    return null;
  const categories = new Set<string>();
  for (const price of input.prices) {
    if (
      categories.has(price.category) ||
      (price.category !== "general" &&
        !enabledCategories.includes(price.category)) ||
      !Number.isInteger(price.priceCents) ||
      price.priceCents < 0 ||
      price.priceCents > 10_000_000
    )
      return null;
    categories.add(price.category);
  }
  return {
    ...input,
    name,
    description,
    rule,
    enrolmentOpensOn: opens.toString(),
    enrolmentClosesOn: closes.toString(),
    prices: [...input.prices],
  };
}
/** The editable part of a stored activity, to check it again before publishing. */
export function inputOf(activity: {
  facilityId: string;
  resourceId: string;
  sport: string;
  name: LocalizedText;
  description: LocalizedText;
  rule: WeeklyRule;
  places: number;
  minAge: number | null;
  maxAge: number | null;
  enrolmentOpensOn: string;
  enrolmentClosesOn: string;
  prices: ActivityPrice[];
}): ActivityInput {
  return {
    facilityId: activity.facilityId,
    resourceId: activity.resourceId,
    sport: activity.sport,
    name: activity.name,
    description: activity.description,
    rule: activity.rule,
    places: activity.places,
    minAge: activity.minAge,
    maxAge: activity.maxAge,
    enrolmentOpensOn: activity.enrolmentOpensOn,
    enrolmentClosesOn: activity.enrolmentClosesOn,
    prices: activity.prices,
  };
}
/** Cancelled activities and those whose last day has passed are kept as they were. */
export function isEditable(
  activity: { status: string; rule: WeeklyRule },
  today: Temporal.PlainDate,
): boolean {
  return (
    activity.status !== "cancelled" &&
    Temporal.PlainDate.compare(
      Temporal.PlainDate.from(activity.rule.endsOn),
      today,
    ) >= 0
  );
}
/** Enrolment state on the municipality's local date. */
export function enrolmentState(
  activity: { enrolmentOpensOn: string; enrolmentClosesOn: string },
  today: Temporal.PlainDate,
): "upcoming" | "open" | "closed" {
  if (
    Temporal.PlainDate.compare(
      today,
      Temporal.PlainDate.from(activity.enrolmentOpensOn),
    ) < 0
  )
    return "upcoming";
  return Temporal.PlainDate.compare(
    today,
    Temporal.PlainDate.from(activity.enrolmentClosesOn),
  ) > 0
    ? "closed"
    : "open";
}
/** Enrolment state shown in the catalogue: a cancelled activity is closed, a full one says so. */
export function catalogueEnrolment(
  activity: {
    status: string;
    enrolmentOpensOn: string;
    enrolmentClosesOn: string;
    freePlaces: number;
  },
  today: Temporal.PlainDate,
): "upcoming" | "open" | "full" | "closed" {
  if (activity.status === "cancelled") return "closed";
  const state = enrolmentState(activity, today);
  return state === "open" && activity.freePlaces === 0 ? "full" : state;
}
