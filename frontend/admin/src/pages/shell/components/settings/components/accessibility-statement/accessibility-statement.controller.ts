// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import type { FormEvent } from "react";
import { useUpdateMunicipalitySettingsMutation } from "@/queries/municipality-settings/update-municipality-settings.mutation";
import type { Accessibility, MunicipalitySettings } from "@/types/models";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
type Field = "email" | "reviewedOn";
/** The municipality's accessibility statement (RD 1112/2018, art. 15; #9, #76). */
export function useAccessibilityStatementController(args: {
  settings: MunicipalitySettings;
}) {
  const [statement, setStatement] = useState<Accessibility>(
    args.settings.accessibility,
  );
  const [invalid, setInvalid] = useState<Field | null>(null);
  const [saved, setSaved] = useState(false);
  const mutation = useUpdateMunicipalitySettingsMutation();
  function update(patch: Partial<Accessibility>) {
    setStatement((current) => ({ ...current, ...patch }));
    setInvalid(null);
    setSaved(false);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    const email = statement.email.trim();
    const problem: Field | null =
      email && !EMAIL.test(email)
        ? "email"
        : !statement.reviewedOn ||
            statement.reviewedOn > new Date().toISOString().slice(0, 10)
          ? "reviewedOn"
          : null;
    if (problem) {
      setInvalid(problem);
      document
        .querySelector<HTMLElement>(
          `#accessibility-statement-form [name="${problem}"]`,
        )
        ?.focus();
      return;
    }
    try {
      await mutation.mutateAsync({ accessibility: { ...statement, email } });
      setSaved(true);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    statement,
    update,
    setException: (locale: "gl" | "es", value: string) =>
      update({ exceptions: { ...statement.exceptions, [locale]: value } }),
    invalid,
    save,
    saved,
    mutation,
  };
}
