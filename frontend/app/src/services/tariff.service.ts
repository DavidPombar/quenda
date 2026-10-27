// SPDX-License-Identifier: AGPL-3.0-or-later
import type {
  Category,
  CategoryPrice,
  Facility,
  Municipality,
  TariffCategory,
  UserCategory,
} from "@/types/models";
import type { TextKey } from "./i18n.service";
const LABELS: Record<TariffCategory, TextKey> = {
  general: "tariffGeneral",
  resident: "categoryResident",
  family: "categoryFamily",
  local_club: "categoryLocalClub",
  minor: "categoryMinor",
  large_family: "categoryLargeFamily",
  disability: "categoryDisability",
  senior: "categorySenior",
};
const STATUSES: Record<UserCategory["status"], TextKey> = {
  requested: "statusRequested",
  verified: "statusVerified",
  rejected: "statusRejected",
};
export function categoryLabel(category: TariffCategory): TextKey {
  return LABELS[category];
}
export function categoryStatusLabel(status: UserCategory["status"]): TextKey {
  return STATUSES[status];
}
/** Category prices the municipality currently offers, in catalogue order. */
export function offeredPrices(
  facility: Facility,
  municipality: Municipality,
): CategoryPrice[] {
  return facility.prices.filter((price) =>
    municipality.enabledCategories.includes(price.category),
  );
}
/** Categories the person can still ask for: offered, and not pending or verified. */
export function requestableCategories(
  municipality: Municipality,
  mine: UserCategory[],
): Category[] {
  return municipality.enabledCategories.filter(
    (category) =>
      !mine.some(
        (entry) => entry.category === category && entry.status !== "rejected",
      ),
  );
}
