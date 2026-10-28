// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { Category } from "../../../shared/application/categories";
export type UserCategoryStatus = "requested" | "verified" | "rejected";
export interface UserCategory {
  category: Category;
  status: UserCategoryStatus;
  /** Null when a manager assigned the category without a request. */
  requestedAt: Temporal.Instant | null;
  decidedAt: Temporal.Instant | null;
}
export interface CitizenCategories {
  userId: string;
  displayName: string;
  categories: UserCategory[];
}
export interface CategoryRequest {
  userId: string;
  displayName: string;
  category: Category;
  requestedAt: Temporal.Instant;
}
