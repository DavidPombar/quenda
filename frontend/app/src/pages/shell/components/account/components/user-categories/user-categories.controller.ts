// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { useGetMyCategoriesQuery } from "@/queries/categories/get-my-categories.query";
import { useRequestCategoryMutation } from "@/queries/categories/request-category.mutation";
import { useSetFamilyPreferenceMutation } from "@/queries/categories/set-family-preference.mutation";
import { requestableCategories } from "@/services/tariff.service";
import type { Category, Municipality } from "@/types/models";
export function useUserCategoriesController(args: {
  userId: string;
  municipality: Municipality;
}) {
  const query = useGetMyCategoriesQuery(args.userId);
  const request = useRequestCategoryMutation();
  const preference = useSetFamilyPreferenceMutation();
  const [choice, setChoice] = useState<Category | "">("");
  const mine = query.data?.categories ?? [];
  const options = requestableCategories(args.municipality, mine);
  async function submit() {
    if (!choice) return;
    try {
      await request.mutateAsync(choice);
      setChoice("");
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    query,
    mine,
    options,
    choice,
    setChoice: (value: string) => {
      request.reset();
      setChoice(value as Category | "");
    },
    submit,
    request,
    familyVerified: mine.some(
      (entry) => entry.category === "family" && entry.status === "verified",
    ),
    prefersFamily: query.data?.prefersFamilyTariff ?? false,
    setPrefersFamily: (value: boolean) => preference.mutate(value),
    preference,
    offered: args.municipality.enabledCategories.length > 0,
  };
}
