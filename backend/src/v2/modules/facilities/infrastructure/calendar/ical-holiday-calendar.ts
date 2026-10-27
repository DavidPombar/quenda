// SPDX-License-Identifier: AGPL-3.0-or-later
import ICAL from "ical.js";
import { Temporal } from "@js-temporal/polyfill";
import { HolidayCalendar } from "../../domain/holiday-calendar";
const MAX_EVENTS = 256;
const MAX_OCCURRENCES = 200;
function plainDate(time: ICAL.Time) {
  return Temporal.PlainDate.from({
    year: time.year,
    month: time.month,
    day: time.day,
  });
}
/** Length in days; an all-day DTSTART without an end lasts one day (RFC 5545 §3.6.1). */
function days(component: ICAL.Component, event: ICAL.Event) {
  if (!component.hasProperty("dtend") && !component.hasProperty("duration"))
    return 1;
  return event.duration.toSeconds() / 86400;
}
function parse(calendar: string) {
  if (calendar.length > 65536) throw new Error("Calendar exceeds 64 KiB");
  const root = new ICAL.Component(ICAL.parse(calendar));
  if (
    root.name !== "vcalendar" ||
    root.getFirstPropertyValue("version") !== "2.0"
  )
    throw new Error("Expected iCalendar 2.0");
  const components = root.getAllSubcomponents("vevent");
  if (components.length > MAX_EVENTS) throw new Error("Too many holidays");
  for (const component of components) {
    const event = new ICAL.Event(component);
    if (!event.uid || !component.hasProperty("dtstart"))
      throw new Error("Holidays need UID and DTSTART");
    if (!event.startDate.isDate) throw new Error("Holidays are all-day");
    if (component.hasProperty("dtend") && !event.endDate.isDate)
      throw new Error("Holidays end on a date");
    if (event.startDate.year < 2000 || event.startDate.year > 2100)
      throw new Error("Unsupported calendar horizon");
    const length = days(component, event);
    if (!Number.isInteger(length) || length < 1 || length > 31)
      throw new Error("A holiday lasts 1–31 days");
    if (component.hasProperty("recurrence-id"))
      throw new Error("Recurrence exceptions are not supported");
    for (const prop of component.getAllProperties("rrule")) {
      const rule = prop.getFirstValue() as ICAL.Recur;
      if (rule.freq !== "YEARLY" || rule.interval < 1)
        throw new Error("Holidays repeat yearly at most");
    }
  }
  return components;
}
export class IcalHolidayCalendar extends HolidayCalendar {
  validate(calendar: string) {
    if (!calendar.trim()) return true;
    try {
      parse(calendar);
      return true;
    } catch {
      return false;
    }
  }
  isHoliday(calendar: string, date: Temporal.PlainDate) {
    if (!calendar.trim()) return false;
    for (const component of parse(calendar)) {
      if (component.getFirstPropertyValue("status") === "CANCELLED") continue;
      const event = new ICAL.Event(component);
      const length = days(component, event);
      const iterator = event.iterator();
      let count = 0;
      for (
        let occurrence = iterator.next();
        occurrence && ++count <= MAX_OCCURRENCES;
        occurrence = iterator.next()
      ) {
        const first = plainDate(occurrence);
        if (Temporal.PlainDate.compare(first, date) > 0) break;
        if (Temporal.PlainDate.compare(date, first.add({ days: length })) < 0)
          return true;
      }
    }
    return false;
  }
}
