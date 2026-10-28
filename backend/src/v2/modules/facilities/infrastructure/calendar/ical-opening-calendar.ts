// SPDX-License-Identifier: AGPL-3.0-or-later
import ICAL from "ical.js";
import { Temporal } from "@js-temporal/polyfill";
import {
  OpeningCalendar,
  OpeningInterval,
} from "../../domain/opening-calendar";
const MAX_OCCURRENCES = 32000;
function instant(
  time: ICAL.Time,
  component: ICAL.Component,
  timezone: string,
  property = "dtstart",
) {
  const zone =
    time.zone?.tzid === "UTC"
      ? "UTC"
      : String(
          component.getFirstProperty(property)?.getParameter("tzid") ??
            timezone,
        );
  return Temporal.PlainDateTime.from({
    year: time.year,
    month: time.month,
    day: time.day,
    hour: time.hour,
    minute: time.minute,
    second: time.second,
  })
    .toZonedDateTime(zone, { disambiguation: "reject" })
    .toInstant();
}
function parse(calendar: string, timezone: string) {
  if (calendar.length > 65536) throw new Error("Calendar exceeds 64 KiB");
  Temporal.PlainDateTime.from("2026-01-01T12:00").toZonedDateTime(timezone);
  const root = new ICAL.Component(ICAL.parse(calendar));
  if (
    root.name !== "vcalendar" ||
    root.getFirstPropertyValue("version") !== "2.0"
  )
    throw new Error("Expected iCalendar 2.0");
  const components = root.getAllSubcomponents("vevent");
  if (!components.length || components.length > 64)
    throw new Error("Expected 1–64 events");
  const masterIds = new Set<string>();
  for (const component of components) {
    const event = new ICAL.Event(component);
    if (
      !event.uid ||
      !component.hasProperty("dtstart") ||
      (!component.hasProperty("dtend") && !component.hasProperty("duration")) ||
      event.startDate.isDate
    )
      throw new Error("Timed events need UID, DTSTART and an end");
    if (event.startDate.year < 2000 || event.startDate.year > 2100)
      throw new Error("Unsupported calendar horizon");
    if (event.duration.toSeconds() <= 0 || event.duration.toSeconds() > 172800)
      throw new Error("Opening must last at most 48 hours");
    if (component.getFirstProperty("recurrence-id")?.getParameter("range"))
      throw new Error("Range exceptions are not supported");
    for (const prop of component.getAllProperties("rrule")) {
      const rule = prop.getFirstValue() as ICAL.Recur;
      if (
        !["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(rule.freq) ||
        rule.interval < 1 ||
        /BYSECOND|BYMINUTE|BYHOUR/.test(rule.toString())
      )
        throw new Error("Unsupported recurrence frequency");
    }
    for (const prop of component.getAllProperties()) {
      const tz = prop.getParameter("tzid");
      if (tz && tz !== timezone && tz !== "UTC")
        throw new Error("Event timezone must match municipality");
    }
    instant(event.startDate, component, timezone);
    if (!event.isRecurrenceException()) {
      if (masterIds.has(event.uid)) throw new Error("Duplicate master UID");
      masterIds.add(event.uid);
    }
  }
  if (
    components.some(
      (component) =>
        component.hasProperty("recurrence-id") &&
        !masterIds.has(new ICAL.Event(component).uid),
    )
  )
    throw new Error("Orphan recurrence exception");
  return components;
}
export class IcalOpeningCalendar extends OpeningCalendar {
  validate(calendar: string, timezone: string) {
    try {
      parse(calendar, timezone);
      return true;
    } catch {
      return false;
    }
  }
  expand(args: {
    calendar: string;
    timezone: string;
    date: Temporal.PlainDate;
  }): OpeningInterval[] {
    return this.expandRange({ ...args, from: args.date, to: args.date });
  }
  expandRange(args: {
    calendar: string;
    timezone: string;
    from: Temporal.PlainDate;
    to: Temporal.PlainDate;
  }): OpeningInterval[] {
    const components = parse(args.calendar, args.timezone);
    const dayStart = args.from.toZonedDateTime(args.timezone).toInstant();
    const dayEnd = args.to
      .add({ days: 1 })
      .toZonedDateTime(args.timezone)
      .toInstant();
    const intervals: OpeningInterval[] = [];
    function add(event: ICAL.Event, start: ICAL.Time, end: ICAL.Time) {
      if (event.component.getFirstPropertyValue("status") === "CANCELLED")
        return;
      try {
        const from = instant(start, event.component, args.timezone);
        const to = instant(
          end,
          event.component,
          args.timezone,
          event.component.hasProperty("dtend") ? "dtend" : "dtstart",
        );
        if (
          Temporal.Instant.compare(from, to) < 0 &&
          Temporal.Instant.compare(to, dayStart) > 0 &&
          Temporal.Instant.compare(from, dayEnd) < 0
        )
          intervals.push({ start: from, end: to });
      } catch (error) {
        // RFC 5545 invalid local occurrences (DST gaps) are ignored, never shifted.
        if (!(error instanceof RangeError)) throw error;
      }
    }
    for (const component of components) {
      const event = new ICAL.Event(component);
      if (event.isRecurrenceException()) {
        add(event, event.startDate, event.endDate);
        continue;
      }
      const iterator = event.iterator();
      const exceptions = components
        .filter(
          (other) =>
            other.hasProperty("recurrence-id") &&
            other.getFirstPropertyValue("uid") === event.uid,
        )
        .map((other) => new ICAL.Event(other).recurrenceId.toString());
      let count = 0;
      for (
        let occurrence = iterator.next();
        occurrence;
        occurrence = iterator.next()
      ) {
        if (++count > MAX_OCCURRENCES)
          throw new Error("Calendar recurrence limit exceeded");
        const date = Temporal.PlainDate.from({
          year: occurrence.year,
          month: occurrence.month,
          day: occurrence.day,
        });
        if (Temporal.PlainDate.compare(date, args.to.add({ days: 2 })) > 0)
          break;
        if (exceptions.includes(occurrence.toString())) continue;
        const details = event.getOccurrenceDetails(occurrence);
        add(details.item, details.startDate, details.endDate);
      }
    }
    return intervals
      .sort((a, b) => Temporal.Instant.compare(a.start, b.start))
      .reduce<OpeningInterval[]>((merged, interval) => {
        const previous = merged.at(-1);
        if (
          previous &&
          Temporal.Instant.compare(interval.start, previous.end) <= 0
        ) {
          if (Temporal.Instant.compare(interval.end, previous.end) > 0)
            previous.end = interval.end;
        } else merged.push({ ...interval });
        return merged;
      }, []);
  }
}
