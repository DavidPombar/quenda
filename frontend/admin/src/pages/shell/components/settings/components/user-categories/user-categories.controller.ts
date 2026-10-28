// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { useUpdateMunicipalitySettingsMutation } from "@/queries/municipality-settings/update-municipality-settings.mutation";
import { CATEGORIES } from "@/types/models";
import type { Category, MunicipalitySettings } from "@/types/models";
export function useUserCategoriesController(args: {
  settings: MunicipalitySettings;
}) {
  const [enabled, setEnabled] = useState<Category[]>(
    args.settings.enabledCategories,
  );
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const mutation = useUpdateMunicipalitySettingsMutation();
  function toggle(category: Category, checked: boolean) {
    setEnabled((current) =>
      CATEGORIES.filter((item) =>
        item === category ? checked : current.includes(item),
      ),
    );
    setDirty(true);
    setSaved(false);
  }
  async function save() {
    try {
      await mutation.mutateAsync({ enabledCategories: enabled });
      setDirty(false);
      setSaved(true);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    categories: CATEGORIES,
    enabled,
    toggle,
    save,
    dirty,
    saved,
    mutation,
  };
}
