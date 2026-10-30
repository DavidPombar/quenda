// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState, type FormEvent } from "react";
import { useCreateOrganizationMutation } from "@/queries/seasons/create-organization.mutation";
import { useUpdateOrganizationMutation } from "@/queries/seasons/update-organization.mutation";
import { useAddRepresentativeMutation } from "@/queries/seasons/add-representative.mutation";
import { useRemoveRepresentativeMutation } from "@/queries/seasons/remove-representative.mutation";
import type { TextKey } from "@/services/i18n.service";
import type { Organization, OrganizationInput, Sport } from "@/types/models";
const EMPTY: OrganizationInput = {
  name: "",
  taxId: null,
  sport: null,
  contactEmail: null,
};
export function useOrganizationsController() {
  const create = useCreateOrganizationMutation();
  const update = useUpdateOrganizationMutation();
  const add = useAddRepresentativeMutation();
  const remove = useRemoveRepresentativeMutation();
  const [draft, setDraft] = useState<OrganizationInput>(EMPTY);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{
    key: TextKey;
    error: boolean;
  } | null>(null);
  async function run(action: () => Promise<unknown>, done: TextKey) {
    setMessage(null);
    try {
      await action();
      setMessage({ key: done, error: false });
      return true;
    } catch {
      setMessage({ key: "seasonError", error: true });
      return false;
    }
  }
  return {
    draft,
    edit: (patch: Partial<OrganizationInput>) =>
      setDraft((current) => ({ ...current, ...patch })),
    setSport: (value: string) =>
      setDraft((current) => ({
        ...current,
        sport: (value || null) as Sport | null,
      })),
    create,
    submit: async (event: FormEvent) => {
      event.preventDefault();
      if (await run(() => create.mutateAsync(draft), "clubCreated"))
        setDraft(EMPTY);
    },
    email: (id: string) => emails[id] ?? "",
    setEmail: (id: string, value: string) =>
      setEmails((current) => ({ ...current, [id]: value })),
    addRepresentative: async (event: FormEvent, organization: Organization) => {
      event.preventDefault();
      add.reset();
      const email = (emails[organization.id] ?? "").trim();
      if (!email) return;
      try {
        await add.mutateAsync({ organizationId: organization.id, email });
        setEmails((current) => ({ ...current, [organization.id]: "" }));
        setMessage({ key: "seasonDone", error: false });
      } catch (error) {
        const code = (error as { code?: string }).code ?? "";
        setMessage({
          key:
            code === "not_found"
              ? "representativeMissing"
              : code === "validation"
                ? "representativeTaken"
                : "seasonError",
          error: true,
        });
      }
    },
    removeRepresentative: (organizationId: string, userId: string) =>
      run(() => remove.mutateAsync({ organizationId, userId }), "seasonDone"),
    toggleArchive: (organization: Organization) =>
      run(
        () =>
          update.mutateAsync({
            id: organization.id,
            input: {
              name: organization.name,
              taxId: organization.taxId,
              sport: organization.sport,
              contactEmail: organization.contactEmail,
              archived: !organization.archivedAt,
            },
          }),
        "seasonDone",
      ),
    message,
  };
}
