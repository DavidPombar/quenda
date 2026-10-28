// SPDX-License-Identifier: AGPL-3.0-or-later
import ICAL from "ical.js";
import type { Temporal } from "@js-temporal/polyfill";
import type { CalendarDocument } from "../../domain/calendar-entry.read-model";
function utc(instant: Temporal.Instant) {
  const value = instant.toZonedDateTimeISO("UTC");
  return ICAL.Time.fromData(
    {
      year: value.year,
      month: value.month,
      day: value.day,
      hour: value.hour,
      minute: value.minute,
      second: value.second,
      isDate: false,
    },
    ICAL.Timezone.utcTimezone,
  );
}
/**
 * Serializes bookings as RFC 5545 PUBLISH events. Times are UTC instants, so
 * no VTIMEZONE is needed and clients render them in local time. UID is stable
 * per booking and SEQUENCE grows with each change, so subscribed calendars
 * replace the previous version instead of duplicating it.
 */
export function bookingCalendar(document: CalendarDocument) {
  const root = new ICAL.Component("vcalendar");
  root.addPropertyWithValue("version", "2.0");
  root.addPropertyWithValue("prodid", "-//Quenda//Reservas municipais//GL");
  root.addPropertyWithValue("calscale", "GREGORIAN");
  root.addPropertyWithValue("method", "PUBLISH");
  root.addPropertyWithValue("x-wr-calname", "Quenda");
  for (const entry of document.entries) {
    const event = new ICAL.Component("vevent");
    event.addPropertyWithValue("uid", `${entry.bookingId}@quenda`);
    event.addPropertyWithValue("dtstamp", utc(document.generatedAt));
    event.addPropertyWithValue("created", utc(entry.createdAt));
    event.addPropertyWithValue("dtstart", utc(entry.start));
    event.addPropertyWithValue("dtend", utc(entry.end));
    event.addPropertyWithValue("sequence", entry.sequence);
    event.addPropertyWithValue(
      "status",
      entry.status === "cancelled" ? "CANCELLED" : "CONFIRMED",
    );
    // The court is named only when it differs from the facility (a facility with several).
    event.addPropertyWithValue(
      "summary",
      entry.resourceName === entry.facilityName
        ? entry.facilityName
        : `${entry.facilityName}, ${entry.resourceName}`,
    );
    event.addPropertyWithValue("location", entry.facilityAddress);
    event.addPropertyWithValue("description", entry.municipalityName);
    event.addPropertyWithValue("transp", "OPAQUE");
    root.addSubcomponent(event);
  }
  return root.toString();
}
