// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Locale } from "@/types/models";
/** Same-origin download of an activity's people; the session cookie authorises it (#97). */
export function enrolmentsCsvUrl(activityId: string, locale: Locale) {
  return `/v2/manager/activities/${encodeURIComponent(activityId)}/enrolments.csv?${new URLSearchParams({ lang: locale })}`;
}
