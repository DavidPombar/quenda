// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import type { FormEvent } from "react";
import { useUpdateMunicipalitySettingsMutation } from "@/queries/municipality-settings/update-municipality-settings.mutation";
import type { MunicipalitySettings } from "@/types/models";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The council's own Umami, off by default (#25). */
export function useWebAnalyticsController(args: {
  settings: MunicipalitySettings;
}) {
  const [url, setUrlValue] = useState(args.settings.analyticsUrl);
  const [website, setWebsiteValue] = useState(
    args.settings.analyticsWebsiteId ?? "",
  );
  const [invalid, setInvalid] = useState(false);
  const [saved, setSaved] = useState(false);
  const mutation = useUpdateMunicipalitySettingsMutation();
  async function save(event: FormEvent) {
    event.preventDefault();
    const base = url.trim();
    const id = website.trim();
    // Both or neither; the server checks the address is one it may call (https).
    if (!!base !== !!id || (id && !UUID.test(id))) {
      setInvalid(true);
      document
        .querySelector<HTMLElement>('#web-analytics-form [name="analyticsUrl"]')
        ?.focus();
      return;
    }
    try {
      const result = await mutation.mutateAsync({
        analyticsUrl: base,
        analyticsWebsiteId: id || null,
      });
      setUrlValue(result.settings.analyticsUrl);
      setSaved(true);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  function edited() {
    setInvalid(false);
    setSaved(false);
  }
  return {
    url,
    setUrl: (value: string) => {
      setUrlValue(value);
      edited();
    },
    website,
    setWebsite: (value: string) => {
      setWebsiteValue(value);
      edited();
    },
    off: !args.settings.analyticsUrl,
    invalid,
    save,
    saved,
    mutation,
  };
}
