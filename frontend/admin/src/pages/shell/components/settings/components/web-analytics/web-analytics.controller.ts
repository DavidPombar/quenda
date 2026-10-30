// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import type { FormEvent } from "react";
import { useUpdateMunicipalitySettingsMutation } from "@/queries/municipality-settings/update-municipality-settings.mutation";
import type { MunicipalitySettings } from "@/types/models";
/** Counting citizen app visits in the deployment's Umami, off by default (#57). */
export function useWebAnalyticsController(args: {
  settings: MunicipalitySettings;
}) {
  const [enabled, setEnabledValue] = useState(args.settings.analyticsEnabled);
  const [saved, setSaved] = useState(false);
  const mutation = useUpdateMunicipalitySettingsMutation();
  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      const result = await mutation.mutateAsync({ analyticsEnabled: enabled });
      setEnabledValue(result.settings.analyticsEnabled);
      setSaved(true);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    enabled,
    setEnabled: (value: boolean) => {
      setEnabledValue(value);
      setSaved(false);
    },
    available: args.settings.analyticsAvailable,
    off: !args.settings.analyticsEnabled,
    save,
    saved,
    mutation,
  };
}
