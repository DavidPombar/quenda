// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import type { FormEvent } from "react";
import { useUpdateMunicipalitySettingsMutation } from "@/queries/municipality-settings/update-municipality-settings.mutation";
import type { LegalTexts, Locale, MunicipalitySettings } from "@/types/models";
export const MIN_LEGAL_LENGTH = 20;
export function useLegalTextsController(args: {
  settings: MunicipalitySettings;
}) {
  const [draft, setDraft] = useState<LegalTexts>(() => ({
    ...args.settings.legalTexts,
  }));
  const [invalid, setInvalid] = useState<Locale[]>([]);
  const [published, setPublished] = useState("");
  const mutation = useUpdateMunicipalitySettingsMutation();
  const changed =
    draft.gl !== args.settings.legalTexts.gl ||
    draft.es !== args.settings.legalTexts.es;
  function setText(locale: Locale, value: string) {
    setDraft((current) => ({ ...current, [locale]: value }));
    setInvalid((current) => current.filter((item) => item !== locale));
    setPublished("");
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    const next = (["gl", "es"] as const).filter(
      (locale) => draft[locale].trim().length < MIN_LEGAL_LENGTH,
    );
    setInvalid(next);
    if (next.length) {
      document
        .querySelector<HTMLElement>(`#legal-form [name="legal-${next[0]}"]`)
        ?.focus();
      return;
    }
    if (!changed) return;
    try {
      const result = await mutation.mutateAsync({
        legalTexts: { gl: draft.gl.trim(), es: draft.es.trim() },
      });
      setPublished(result.settings.legalVersion);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return { draft, setText, invalid, changed, save, published, mutation };
}
