// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import type { FormEvent } from "react";
import { useCreateManagerMutation } from "@/queries/operator/create-manager.mutation";
import type { TextKey } from "@/services/i18n.service";
import type { DeploymentMunicipality, NewManager } from "@/types/models";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN = /^[A-Za-z0-9._-]{3,64}$/;
export function useManagerFormController(args: {
  municipality: DeploymentMunicipality;
  onClose: (name?: string) => void;
}) {
  const [draft, setDraft] = useState<NewManager>(() => ({
    id: crypto.randomUUID(),
    displayName: "",
    email: "",
    login: "",
  }));
  const [created, setCreated] = useState<{
    name: string;
    login: string;
    password: string;
  } | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<"displayName" | "email" | "login", TextKey>>
  >({});
  const mutation = useCreateManagerMutation();
  function setField(key: "displayName" | "email" | "login", value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    const next: typeof errors = {};
    if (draft.displayName.trim().length < 2)
      next.displayName = "operatorNameError";
    if (!EMAIL.test(draft.email.trim())) next.email = "operatorEmailError";
    if (!LOGIN.test(draft.login.trim())) next.login = "operatorLoginError";
    setErrors(next);
    const invalid = Object.keys(next)[0];
    if (invalid) {
      document
        .querySelector<HTMLElement>(`#manager-form [name="${invalid}"]`)
        ?.focus();
      return;
    }
    try {
      const created = await mutation.mutateAsync({
        municipalityId: args.municipality.settings.id,
        manager: {
          id: draft.id,
          displayName: draft.displayName.trim(),
          email: draft.email.trim(),
          login: draft.login.trim(),
        },
      });
      if (created.login && created.temporaryPassword)
        setCreated({
          name: created.displayName,
          login: created.login,
          password: created.temporaryPassword,
        });
      else args.onClose(created.displayName);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    draft,
    setField,
    errors,
    save,
    mutation,
    created,
    done: () => args.onClose(created?.name),
  };
}
