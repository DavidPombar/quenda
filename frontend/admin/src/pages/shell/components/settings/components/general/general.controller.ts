// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import type { FormEvent } from "react";
import { useUpdateMunicipalitySettingsMutation } from "@/queries/municipality-settings/update-municipality-settings.mutation";
import type { Locale, MunicipalitySettings } from "@/types/models";
export function useGeneralController(args: { settings: MunicipalitySettings }) {
  const [contact, setContactValue] = useState(args.settings.contact);
  const [locale, setLocaleValue] = useState<Locale>(args.settings.locale);
  const [contactInvalid, setContactInvalid] = useState(false);
  const [saved, setSaved] = useState(false);
  const mutation = useUpdateMunicipalitySettingsMutation();
  function setContact(value: string) {
    setContactValue(value);
    setContactInvalid(false);
    setSaved(false);
  }
  function setLocale(value: string) {
    setLocaleValue(value === "es" ? "es" : "gl");
    setSaved(false);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (contact.trim().length < 3) {
      setContactInvalid(true);
      document
        .querySelector<HTMLElement>('#general-form [name="contact"]')
        ?.focus();
      return;
    }
    try {
      await mutation.mutateAsync({ contact: contact.trim(), locale });
      setSaved(true);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    contact,
    setContact,
    contactInvalid,
    locale,
    setLocale,
    save,
    saved,
    mutation,
  };
}
