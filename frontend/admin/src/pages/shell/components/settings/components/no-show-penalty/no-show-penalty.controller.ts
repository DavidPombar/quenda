// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import type { FormEvent } from "react";
import { useUpdateMunicipalitySettingsMutation } from "@/queries/municipality-settings/update-municipality-settings.mutation";
import type { TextKey } from "@/services/i18n.service";
import type { MunicipalitySettings } from "@/types/models";
type Field = "noShowLimit" | "noShowWindowDays" | "noShowBlockDays";
export const PENALTY_FIELDS = [
  ["noShowLimit", 1, 20, "noShowLimitLabel", "noShowLimitError"],
  ["noShowWindowDays", 1, 365, "noShowWindowLabel", "noShowDaysError"],
  ["noShowBlockDays", 1, 365, "noShowBlockLabel", "noShowDaysError"],
] as const satisfies readonly (readonly [
  Field,
  number,
  number,
  TextKey,
  TextKey,
])[];
/** Non-economic no-show penalty (C3): a temporary booking block, off when the limit is 0. */
export function useNoShowPenaltyController(args: {
  settings: MunicipalitySettings;
}) {
  const [enabled, setEnabled] = useState(args.settings.noShowLimit > 0);
  const [draft, setDraft] = useState<Record<Field, string>>(() => ({
    noShowLimit: String(args.settings.noShowLimit || 3),
    noShowWindowDays: String(args.settings.noShowWindowDays),
    noShowBlockDays: String(args.settings.noShowBlockDays),
  }));
  const [errors, setErrors] = useState<Partial<Record<Field, TextKey>>>({});
  const [saved, setSaved] = useState(false);
  const mutation = useUpdateMunicipalitySettingsMutation();
  function setField(key: Field, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSaved(false);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    const next: typeof errors = {};
    if (enabled)
      for (const [key, min, max, , error] of PENALTY_FIELDS) {
        const value = Number(draft[key]);
        if (!/^\d+$/.test(draft[key]) || value < min || value > max)
          next[key] = error;
      }
    setErrors(next);
    const invalid = Object.keys(next)[0];
    if (invalid) {
      document
        .querySelector<HTMLElement>(`#no-show-form [name="${invalid}"]`)
        ?.focus();
      return;
    }
    try {
      await mutation.mutateAsync(
        enabled
          ? {
              noShowLimit: Number(draft.noShowLimit),
              noShowWindowDays: Number(draft.noShowWindowDays),
              noShowBlockDays: Number(draft.noShowBlockDays),
            }
          : { noShowLimit: 0 },
      );
      setSaved(true);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    enabled,
    setEnabled: (value: boolean) => {
      setEnabled(value);
      setErrors({});
      setSaved(false);
    },
    draft,
    errors,
    setField,
    save,
    saved,
    mutation,
  };
}
