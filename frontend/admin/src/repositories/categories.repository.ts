// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type {
  Category,
  CategoryRequest,
  CitizenCategories,
  UserCategory,
} from "@/types/models";
export const categoriesRepository = {
  pending: () =>
    apiClient.request<CategoryRequest[]>("manager/category-requests"),
  search: (query: string) =>
    apiClient.request<CitizenCategories[]>(
      `manager/citizens?${new URLSearchParams({ query }).toString()}`,
    ),
  decide: (args: {
    userId: string;
    category: Category;
    status: "verified" | "rejected";
  }) =>
    apiClient.request<UserCategory>(
      `manager/citizens/${args.userId}/categories/${args.category}`,
      { method: "PUT", body: JSON.stringify({ status: args.status }) },
    ),
  revoke: (args: { userId: string; category: Category }) =>
    apiClient.request<void>(
      `manager/citizens/${args.userId}/categories/${args.category}`,
      { method: "DELETE" },
    ),
};
