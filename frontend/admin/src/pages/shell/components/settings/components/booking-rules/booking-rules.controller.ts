// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import type { FormEvent } from "react";
import { useUpdateMunicipalitySettingsMutation } from "@/queries/municipality-settings/update-municipality-settings.mutation";
import type { TextKey } from "@/services/i18n.service";
import type { MunicipalitySettings } from "@/types/models";
type Rule = "advanceDays" | "cancellationHours" | "maxActiveBookings";
export const RULES = [
  ["advanceDays", 1, 90, "advanceDaysLabel", "advanceDaysError"],
  [
    "cancellationHours",
    0,
    168,
    "cancellationHoursLabel",
    "cancellationHoursError",
  ],
  [
    "maxActiveBookings",
    1,
    50,
    "maxActiveBookingsLabel",
    "maxActiveBookingsError",
  ],
] as const satisfies readonly (readonly [
  Rule,
  number,
  number,
  TextKey,
  TextKey,
])[];
export function useBookingRulesController(args: {
  settings: MunicipalitySettings;
}) {
  const [draft, setDraft] = useState<Record<Rule, string>>(() => ({
    advanceDays: String(args.settings.advanceDays),
    cancellationHours: String(args.settings.cancellationHours),
    maxActiveBookings: String(args.settings.maxActiveBookings),
  }));
  const [errors, setErrors] = useState<Partial<Record<Rule, TextKey>>>({});
  const [saved, setSaved] = useState(false);
  const mutation = useUpdateMunicipalitySettingsMutation();
  function setField(key: Rule, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSaved(false);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    const next: typeof errors = {};
    for (const [key, min, max, , error] of RULES) {
      const value = Number(draft[key]);
      if (!/^\d+$/.test(draft[key]) || value < min || value > max)
        next[key] = error;
    }
    setErrors(next);
    const invalid = Object.keys(next)[0];
    if (invalid) {
      document
        .querySelector<HTMLElement>(`#booking-rules-form [name="${invalid}"]`)
        ?.focus();
      return;
    }
    try {
      await mutation.mutateAsync({
        advanceDays: Number(draft.advanceDays),
        cancellationHours: Number(draft.cancellationHours),
        maxActiveBookings: Number(draft.maxActiveBookings),
      });
      setSaved(true);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return { draft, errors, setField, save, saved, mutation };
}
