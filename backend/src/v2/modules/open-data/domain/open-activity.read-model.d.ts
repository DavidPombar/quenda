// SPDX-License-Identifier: AGPL-3.0-or-later
import type { WeeklyRule } from "../../activities/domain/activity.entity";
import type { OpenPublication } from "./open-facility.read-model";
/** A published activity as open data (#97): the offer only, never who enrolled. */
export interface OpenActivity {
  id: string;
  name: string;
  sport: string;
  facilityId: string;
  facilityName: string;
  facilityAddress: string;
  resourceName: string;
  rule: WeeklyRule;
  /** RFC 5545 rule line of the weekly schedule, e.g. FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=… */
  rrule: string;
  places: number;
  minAge: number | null;
  maxAge: number | null;
  enrolmentOpensOn: string;
  enrolmentClosesOn: string;
  /** General indicative price for the whole activity, when there is one. */
  priceCents: number | null;
}
export interface OpenActivities extends OpenPublication {
  activities: OpenActivity[];
}
