// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
export interface CampaignInput {
  name: string;
  startsOn: string;
  endsOn: string;
  criteria: { gl: string; es: string };
  facilityIds: string[];
}
// Long enough for a school year plus summer; keeps the number of occurrences bounded.
const MAX_DAYS = 400;
/** Valid when the dates parse, are ordered and the campaign covers at most MAX_DAYS. */
export function validCampaign(input: CampaignInput) {
  try {
    const start = Temporal.PlainDate.from(input.startsOn);
    const end = Temporal.PlainDate.from(input.endsOn);
    return (
      input.name.trim().length >= 2 &&
      input.facilityIds.length > 0 &&
      Temporal.PlainDate.compare(start, end) <= 0 &&
      start.until(end).days < MAX_DAYS
    );
  } catch {
    return false;
  }
}
