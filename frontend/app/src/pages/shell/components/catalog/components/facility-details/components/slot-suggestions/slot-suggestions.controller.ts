// SPDX-License-Identifier: AGPL-3.0-or-later
import { useSuggestSlotsQuery } from "@/queries/facilities/suggest-slots.query";
import { fill, type TextKey } from "@/services/i18n.service";
import { timeLabel } from "@/services/date.service";
import type { Municipality, SlotSuggestion } from "@/types/models";
export function useSlotSuggestionsController(args: {
  municipality: Municipality;
  facilityId: string;
  date: string;
  around: string | null;
  t: (key: TextKey) => string;
}) {
  const query = useSuggestSlotsQuery({
    slug: args.municipality.slug,
    facilityId: args.facilityId,
    date: args.date,
    around: args.around,
    enabled: true,
  });
  return {
    query,
    items: (query.data ?? []).map((suggestion: SlotSuggestion) => {
      const time = timeLabel(suggestion.start, args.municipality.timezone);
      return {
        suggestion,
        key: `${suggestion.facilityId}-${suggestion.start}`,
        time,
        place: suggestion.sameFacility
          ? args.t("suggestionHere")
          : suggestion.facilityName,
        usual:
          suggestion.occupancyPct === null
            ? args.t("suggestionNoHistory")
            : fill(args.t("suggestionUsual"), {
                pct: suggestion.occupancyPct,
              }),
        label: fill(args.t("suggestionPick"), {
          facility: suggestion.facilityName,
          resource: suggestion.resourceName,
          time,
        }),
      };
    }),
  };
}
