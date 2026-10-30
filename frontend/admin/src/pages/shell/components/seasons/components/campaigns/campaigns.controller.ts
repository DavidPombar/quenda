// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState, type FormEvent } from "react";
import { useSaveCampaignMutation } from "@/queries/seasons/save-campaign.mutation";
import type { CampaignInput } from "@/types/models";
const EMPTY: CampaignInput = {
  name: "",
  startsOn: "",
  endsOn: "",
  criteria: { gl: "", es: "" },
  facilityIds: [],
};
export function useCampaignsController(onCreated: (id: string) => void) {
  const save = useSaveCampaignMutation();
  const [draft, setDraft] = useState<CampaignInput>(EMPTY);
  const [created, setCreated] = useState(false);
  return {
    draft,
    edit: (patch: Partial<CampaignInput>) =>
      setDraft((current) => ({ ...current, ...patch })),
    editCriteria: (locale: "gl" | "es", value: string) =>
      setDraft((current) => ({
        ...current,
        criteria: { ...current.criteria, [locale]: value },
      })),
    toggleFacility: (id: string) =>
      setDraft((current) => ({
        ...current,
        facilityIds: current.facilityIds.includes(id)
          ? current.facilityIds.filter((value) => value !== id)
          : [...current.facilityIds, id],
      })),
    save,
    created,
    submit: async (event: FormEvent) => {
      event.preventDefault();
      setCreated(false);
      try {
        const result = await save.mutateAsync({ input: draft });
        setDraft(EMPTY);
        setCreated(true);
        if (result) onCreated(result.id);
      } catch {
        /* Mutation state presents the error. */
      }
    },
  };
}
