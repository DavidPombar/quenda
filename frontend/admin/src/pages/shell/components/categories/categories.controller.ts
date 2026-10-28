// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import type { FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useListCategoryRequestsQuery } from "@/queries/categories/list-category-requests.query";
import { useSearchCitizensQuery } from "@/queries/categories/search-citizens.query";
import { useDecideCategoryMutation } from "@/queries/categories/decide-category.mutation";
import { useRevokeCategoryMutation } from "@/queries/categories/revoke-category.mutation";
import type { AppContext } from "@/types/app-context";
import type { Category, CitizenCategories } from "@/types/models";
export function useCategoriesController() {
  const context = useOutletContext<AppContext>();
  const isManager = context.session?.role === "manager";
  const requests = useListCategoryRequestsQuery(
    isManager ? context.municipality.id : undefined,
  );
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const citizens = useSearchCitizensQuery(isManager ? query : "");
  const [choices, setChoices] = useState<Record<string, Category | "">>({});
  const [saved, setSaved] = useState(false);
  const decide = useDecideCategoryMutation();
  const revoke = useRevokeCategoryMutation();
  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setQuery(search.trim());
  }
  async function run(action: () => Promise<unknown>) {
    setSaved(false);
    decide.reset();
    revoke.reset();
    try {
      await action();
      setSaved(true);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  function assignable(citizen: CitizenCategories) {
    return context.municipality.enabledCategories.filter(
      (category) =>
        !citizen.categories.some(
          (entry) => entry.category === category && entry.status === "verified",
        ),
    );
  }
  return {
    ...context,
    isManager,
    offered: context.municipality.enabledCategories.length > 0,
    requests,
    search,
    setSearch,
    query,
    submitSearch,
    citizens,
    assignable,
    choiceFor: (userId: string) => choices[userId] ?? "",
    choose: (userId: string, value: string) =>
      setChoices((current) => ({ ...current, [userId]: value as Category })),
    decide: (
      userId: string,
      category: Category,
      status: "verified" | "rejected",
    ) => run(() => decide.mutateAsync({ userId, category, status })),
    assign: (userId: string) => {
      const category = choices[userId];
      if (!category) return Promise.resolve();
      return run(async () => {
        await decide.mutateAsync({ userId, category, status: "verified" });
        setChoices((current) => ({ ...current, [userId]: "" }));
      });
    },
    revoke: (userId: string, category: Category) =>
      run(() => revoke.mutateAsync({ userId, category })),
    pending: decide.isPending || revoke.isPending,
    saved,
    error: decide.error?.message ?? revoke.error?.message ?? "",
  };
}
