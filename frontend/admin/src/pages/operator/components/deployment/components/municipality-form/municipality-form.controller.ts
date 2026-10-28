// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import type { FormEvent } from "react";
import { useCreateMunicipalityMutation } from "@/queries/operator/create-municipality.mutation";
import { SLUG_PATTERN, suggestSlug } from "@/services/slug.service";
import type { TextKey } from "@/services/i18n.service";
import type { Locale, NewMunicipality } from "@/types/models";
export const TIMEZONES = ["Europe/Madrid", "Atlantic/Canary"] as const;
type Field = "name" | "slug" | "contact" | "legal-gl" | "legal-es";
export function useMunicipalityFormController(args: {
  locale: Locale;
  onClose: (name?: string) => void;
}) {
  const [draft, setDraft] = useState<NewMunicipality>(() => ({
    id: crypto.randomUUID(),
    slug: "",
    name: "",
    timezone: "Europe/Madrid",
    locale: args.locale,
    contact: "",
    legalTexts: { gl: "", es: "" },
  }));
  // The slug follows the name until the operator edits it.
  const [slugEdited, setSlugEdited] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, TextKey>>>({});
  const mutation = useCreateMunicipalityMutation();
  function update(patch: Partial<NewMunicipality>, field?: Field) {
    setDraft((current) => ({ ...current, ...patch }));
    if (field) setErrors((current) => ({ ...current, [field]: undefined }));
  }
  function setName(name: string) {
    update(slugEdited ? { name } : { name, slug: suggestSlug(name) }, "name");
  }
  function setSlug(slug: string) {
    setSlugEdited(true);
    update({ slug: slug.toLowerCase() }, "slug");
  }
  function validate() {
    const next: typeof errors = {};
    if (draft.name.trim().length < 2) next.name = "operatorNameError";
    if (!SLUG_PATTERN.test(draft.slug)) next.slug = "operatorSlugError";
    if (draft.contact.trim().length < 3) next.contact = "contactError";
    if (draft.legalTexts.gl.trim().length < 20) next["legal-gl"] = "legalError";
    if (draft.legalTexts.es.trim().length < 20) next["legal-es"] = "legalError";
    setErrors(next);
    return next;
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    const invalid = Object.keys(validate())[0];
    if (invalid) {
      document
        .querySelector<HTMLElement>(`#municipality-form [name="${invalid}"]`)
        ?.focus();
      return;
    }
    try {
      const created = await mutation.mutateAsync({
        ...draft,
        name: draft.name.trim(),
        contact: draft.contact.trim(),
      });
      args.onClose(created.name);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return { draft, update, setName, setSlug, errors, save, mutation };
}
