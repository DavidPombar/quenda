// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import {
  ActivityFacility,
  ActivityRepository,
  ActivityResource,
} from "../domain/activity.repository";
import type { WeeklyRule } from "../domain/activity.entity";
import {
  MAX_SESSIONS,
  SessionClash,
  scheduleCalendar,
} from "../domain/activity-schedule";
import { units } from "../../facilities/domain/resource-units";
import { OpeningCalendar } from "../../facilities/domain/opening-calendar";
import { HolidayCalendar } from "../../facilities/domain/holiday-calendar";
import type { MunicipalitySettings } from "../../../shared/application/municipality-settings";
interface Interval {
  start: Temporal.Instant;
  end: Temporal.Instant;
}
export type SessionPlan =
  | { kind: "ok"; schedule: string; sessions: Interval[]; unitIds: string[] }
  | { kind: "clashes"; clashes: SessionClash[] }
  /** No session left, too many, or a rule the calendar engine rejects. */
  | { kind: "invalid" };
/**
 * The dated sessions of a weekly rule that have not started, as the activity would hold them
 * (#97): the RFC 5545 rule expanded in the municipality's time zone, minus the municipal holidays
 * the facility follows. Sessions outside the facility's opening hours, or on units already held by
 * a booking, a club, another activity or a waiting-list offer, are returned as clashes instead.
 * The caller holds the facility lock.
 */
@Injectable()
export class ActivityPlanner {
  constructor(
    private readonly activities: ActivityRepository,
    private readonly calendar: OpeningCalendar,
    private readonly holidays: HolidayCalendar,
  ) {}
  async plan(args: {
    activityId: string;
    rule: WeeklyRule;
    facility: ActivityFacility;
    resource: ActivityResource;
    resources: readonly ActivityResource[];
    municipality: MunicipalitySettings;
    now: Temporal.Instant;
  }): Promise<SessionPlan> {
    const { rule, facility, municipality } = args;
    const timezone = municipality.timezone;
    const schedule = scheduleCalendar({
      id: args.activityId,
      rule,
      timezone,
    });
    if (!schedule || !this.calendar.validate(schedule, timezone))
      return { kind: "invalid" };
    const from = Temporal.PlainDate.from(rule.startsOn);
    const to = Temporal.PlainDate.from(rule.endsOn);
    const localDate = (instant: Temporal.Instant) =>
      instant.toZonedDateTimeISO(timezone).toPlainDate();
    const sessions = this.calendar
      .expandRange({ calendar: schedule, timezone, from, to })
      .filter(
        (session) =>
          Temporal.Instant.compare(session.start, args.now) > 0 &&
          !(
            facility.followsMunicipalHolidays &&
            this.holidays.isHoliday(
              municipality.holidaysCalendar,
              localDate(session.start),
            )
          ),
      );
    if (!sessions.length || sessions.length > MAX_SESSIONS)
      return { kind: "invalid" };
    const opening = this.calendar.expandRange({
      calendar: facility.openingCalendar,
      timezone,
      from,
      to,
    });
    const clashes = new Map<number, SessionClash>();
    sessions.forEach((session, index) => {
      if (
        !opening.some(
          (open) =>
            Temporal.Instant.compare(open.start, session.start) <= 0 &&
            Temporal.Instant.compare(open.end, session.end) >= 0,
        )
      )
        clashes.set(index, {
          ...session,
          date: localDate(session.start).toString(),
          reason: "closed",
        });
    });
    const unitIds = units(args.resource, args.resources);
    for (const clash of await this.activities.clashes({
      tenantId: municipality.id,
      unitIds,
      intervals: sessions,
      activityId: args.activityId,
    }))
      if (!clashes.has(clash.index)) {
        const session = sessions[clash.index];
        clashes.set(clash.index, {
          ...session,
          date: localDate(session.start).toString(),
          reason: clash.reason,
        });
      }
    if (clashes.size)
      return {
        kind: "clashes",
        clashes: [...clashes.entries()]
          .sort(([a], [b]) => a - b)
          .map(([, clash]) => clash),
      };
    return { kind: "ok", schedule, sessions, unitIds };
  }
}
