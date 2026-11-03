// SPDX-License-Identifier: AGPL-3.0-or-later
import { PAGE_SIZE } from "./catalog.service";
import { fill, type TextKey } from "./i18n.service";
import type { ActivityFilters, Locale, PublicActivity } from "@/types/models";
const SPORT_CODE = /^[a-z0-9-]{2,40}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Filters of the activities page, read from its URL so a search can be shared (#97). */
export function activityFiltersFrom(params: URLSearchParams): ActivityFilters {
  const sport = params.get("sport") ?? "";
  const age = Number(params.get("idade"));
  const page = Number(params.get("paxina"));
  const facilityId = params.get("instalacion") ?? "";
  return {
    sport: SPORT_CODE.test(sport) ? sport : "",
    age:
      params.get("idade") && Number.isInteger(age) && age >= 0 && age <= 120
        ? age
        : null,
    open: params.get("abertas") === "1",
    facilityId: UUID.test(facilityId) ? facilityId : "",
    page: Number.isInteger(page) && page >= 1 && page <= 10000 ? page : 1,
  };
}
export function activityParamsFrom(filters: ActivityFilters) {
  const params = new URLSearchParams();
  if (filters.sport) params.set("sport", filters.sport);
  if (filters.age !== null) params.set("idade", String(filters.age));
  if (filters.open) params.set("abertas", "1");
  if (filters.facilityId) params.set("instalacion", filters.facilityId);
  if (filters.page > 1) params.set("paxina", String(filters.page));
  return params;
}
/** Query string for GET /v2/public/activities. */
export function activitiesQuery(slug: string, filters: ActivityFilters) {
  const params = new URLSearchParams({ slug });
  if (filters.sport) params.set("sport", filters.sport);
  if (filters.age !== null) params.set("age", String(filters.age));
  if (filters.open) params.set("open", "true");
  if (filters.facilityId) params.set("facility", filters.facilityId);
  params.set("page", String(filters.page));
  params.set("pageSize", String(PAGE_SIZE));
  return params.toString();
}
const dayKey = (day: number) => `weekday${day}` as TextKey;
/** "martes e xoves, 17:00–18:00" */
export function scheduleLabel(
  activity: Pick<PublicActivity, "rule">,
  t: (key: TextKey) => string,
  locale: Locale,
) {
  const names = activity.rule.weekdays.map((day) => t(dayKey(day)));
  const and = locale === "es" ? " y " : " e ";
  const days =
    names.length > 1
      ? `${names.slice(0, -1).join(", ")}${and}${names.at(-1)}`
      : (names[0] ?? "");
  return `${days}, ${activity.rule.startsLocal}–${activity.rule.endsLocal}`;
}
/** Age range in words, or null when the activity has no limits. */
export function agesLabel(
  activity: Pick<PublicActivity, "minAge" | "maxAge">,
  t: (key: TextKey) => string,
) {
  const { minAge: min, maxAge: max } = activity;
  if (min !== null && max !== null)
    return fill(t("activityAgesRange"), { min, max });
  if (min !== null) return fill(t("activityAgesFrom"), { min });
  if (max !== null) return fill(t("activityAgesUpTo"), { max });
  return null;
}
const ENROLMENT: Record<PublicActivity["enrolment"], TextKey> = {
  upcoming: "enrolmentUpcoming",
  open: "enrolmentOpen",
  full: "enrolmentFull",
  closed: "enrolmentClosed",
};
export function enrolmentLabel(activity: Pick<PublicActivity, "enrolment">) {
  return ENROLMENT[activity.enrolment];
}
