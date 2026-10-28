// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Category } from "../../../shared/application/categories";
import type {
  CategoryRequest,
  CitizenCategories,
  UserCategory,
} from "./user-category.entity";
export abstract class UserCategoryRepository {
  /** Serialises changes to one person's categories within the current transaction. */
  abstract lockUser(tenantId: string, userId: string): Promise<void>;
  /** Active citizen with their categories, or null for managers and deleted accounts. */
  abstract findCitizen(
    tenantId: string,
    userId: string,
  ): Promise<CitizenCategories | null>;
  abstract save(
    tenantId: string,
    userId: string,
    value: UserCategory,
  ): Promise<void>;
  abstract remove(
    tenantId: string,
    userId: string,
    category: Category,
  ): Promise<boolean>;
  abstract prefersFamily(tenantId: string, userId: string): Promise<boolean>;
  abstract setPrefersFamily(
    tenantId: string,
    userId: string,
    value: boolean,
  ): Promise<void>;
  /** Oldest first, so requests are reviewed in arrival order. */
  abstract listPending(tenantId: string): Promise<CategoryRequest[]>;
  abstract searchCitizens(
    tenantId: string,
    query: string,
    limit: number,
  ): Promise<CitizenCategories[]>;
}
