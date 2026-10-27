// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Category, UserCategory } from "@/types/models";
import type { TextKey } from "./i18n.service";
const LABELS: Record<Category, TextKey> = {
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
export function categoryLabel(category: Category): TextKey {
  return LABELS[category];
}
export function categoryStatusLabel(status: UserCategory["status"]): TextKey {
  return STATUSES[status];
}
/** Euro text from an input, as cents; null when empty, NaN when invalid. */
export function centsFromInput(value: string): number | null {
  if (!value.trim()) return null;
  const euros = Number(value.replace(",", "."));
  return Number.isFinite(euros) && euros >= 0 && euros <= 1000
    ? Math.round(euros * 100)
    : Number.NaN;
}
