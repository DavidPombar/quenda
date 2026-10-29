// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
export interface Span {
  start: Temporal.Instant;
  end: Temporal.Instant;
}
export interface FacilityActivity {
  id: string;
  name: string;
  sport: string;
  /** Active leaf resources: whole-court reservations occupy every child unit. */
  unitIds?: readonly string[];
  /** Opening intervals from the facility calendar. */
  open: Span[];
  /** When the facility was in service (status `active`). */
  active: Span[];
  /** Municipal holidays the facility follows, as whole local days. */
  closed: Span[];
  /** A no-show held the slot but was not used, so it counts apart and not as booked time. */
  bookings: (Span & {
    status: "confirmed" | "cancelled" | "no_show";
    unitIds?: readonly string[];
  })[];
}
export interface Figures {
  bookedMinutes: number;
  openMinutes: number;
  /** Booked over open time, rounded percent; null when the facility was never open. */
  occupancy: number | null;
}
export interface FacilityReport extends Figures {
  id: string;
  name: string;
  sport: string;
  confirmed: number;
  cancelled: number;
  noShows: number;
}
export interface HeatmapCell extends Figures {
  /** ISO weekday, 1 = Monday. */
  weekday: number;
  /** Local hour, 0–23. */
  hour: number;
}
/** One facility, ISO week, weekday and local hour with open time (open data, #21). */
export interface WeeklyCell extends Figures {
  facilityId: string;
  /** ISO 8601 week-numbering year and week. */
  isoYear: number;
  isoWeek: number;
  /** ISO weekday, 1 = Monday. */
  weekday: number;
  /** Local hour, 0–23. */
  hour: number;
  /** Open time held by no-shows: booked but not used. */
  noShowMinutes: number;
}
export interface OccupancyReport extends Figures {
  confirmed: number;
  cancelled: number;
  noShows: number;
  byFacility: FacilityReport[];
  /** Only weekday × hour cells with open time, so 0 % differs from "closed". */
  heatmap: HeatmapCell[];
}
const compare = Temporal.Instant.compare;
const later = (a: Temporal.Instant, b: Temporal.Instant) =>
  compare(a, b) >= 0 ? a : b;
const earlier = (a: Temporal.Instant, b: Temporal.Instant) =>
  compare(a, b) <= 0 ? a : b;
/** Sorted union without overlaps. */
export function merge(spans: Span[]): Span[] {
  return [...spans]
    .filter((span) => compare(span.start, span.end) < 0)
    .sort((a, b) => compare(a.start, b.start))
    .reduce<Span[]>((merged, span) => {
      const previous = merged.at(-1);
      if (previous && compare(span.start, previous.end) <= 0)
        previous.end = later(previous.end, span.end);
      else merged.push({ start: span.start, end: span.end });
      return merged;
    }, []);
}
export function intersect(a: Span[], b: Span[]): Span[] {
  const left = merge(a);
  const right = merge(b);
  const result: Span[] = [];
  for (const x of left)
    for (const y of right) {
      const start = later(x.start, y.start);
      const end = earlier(x.end, y.end);
      if (compare(start, end) < 0) result.push({ start, end });
    }
  return merge(result);
}
export function subtract(a: Span[], b: Span[]): Span[] {
  let result = merge(a);
  for (const cut of merge(b))
    result = result.flatMap((span) => {
      if (
        compare(cut.end, span.start) <= 0 ||
        compare(cut.start, span.end) >= 0
      )
        return [span];
      return [
        { start: span.start, end: earlier(span.end, cut.start) },
        { start: later(span.start, cut.end), end: span.end },
      ].filter((part) => compare(part.start, part.end) < 0);
    });
  return result;
}
const minutes = (spans: Span[]) =>
  spans.reduce(
    (sum, span) => sum + span.end.since(span.start).total("minutes"),
    0,
  );
/** Splits a span at local hour boundaries; DST gaps and repeats follow the wall clock. */
function byLocalHour(
  span: Span,
  timezone: string,
  add: (local: Temporal.ZonedDateTime, minutes: number) => void,
) {
  let cursor = span.start;
  while (compare(cursor, span.end) < 0) {
    const local = cursor.toZonedDateTimeISO(timezone);
    const boundary = local
      .round({ smallestUnit: "hour", roundingMode: "floor" })
      .add({ hours: 1 })
      .toInstant();
    const end = earlier(boundary, span.end);
    add(local, end.since(cursor).total("minutes"));
    cursor = end;
  }
}
export function figures(bookedMinutes: number, openMinutes: number): Figures {
  return {
    bookedMinutes: Math.round(bookedMinutes),
    openMinutes: Math.round(openMinutes),
    occupancy: openMinutes
      ? Math.round((bookedMinutes / openMinutes) * 100)
      : null,
  };
}
function localRange(
  timezone: string,
  from: Temporal.PlainDate,
  to: Temporal.PlainDate,
): Span {
  return {
    start: from.toZonedDateTime(timezone).toInstant(),
    end: to.add({ days: 1 }).toZonedDateTime(timezone).toInstant(),
  };
}
/**
 * Open time of one facility within the range (calendar while active, minus holidays), and the
 * parts of it held by bookings of one status. Overlaps are merged within each unit only, so
 * simultaneous independent courts count separately; open time counts once per unit.
 */
function facilityTime(facility: FacilityActivity, range: Span) {
  const open = subtract(
    intersect(intersect(facility.open, facility.active), [range]),
    facility.closed,
  );
  const unitIds = facility.unitIds ?? [facility.id];
  const held = (status: "confirmed" | "no_show") =>
    unitIds.flatMap((unitId) =>
      intersect(
        facility.bookings.filter(
          (booking) =>
            booking.status === status &&
            (booking.unitIds ?? [facility.id]).includes(unitId),
        ),
        open,
      ),
    );
  return {
    open,
    units: unitIds.length,
    booked: held("confirmed"),
    noShows: held("no_show"),
  };
}
/**
 * Occupancy of each facility by ISO week, weekday and local hour for the local dates from–to
 * (inclusive). Only cells with open time are returned, so 0 % differs from "closed". Figures
 * are aggregated minutes with no booking or person identifiers.
 */
export function weeklyOccupancy(args: {
  timezone: string;
  from: Temporal.PlainDate;
  to: Temporal.PlainDate;
  facilities: FacilityActivity[];
}): WeeklyCell[] {
  const range = localRange(args.timezone, args.from, args.to);
  const cells = new Map<
    string,
    Omit<WeeklyCell, keyof Figures | "noShowMinutes"> & {
      booked: number;
      open: number;
      noShow: number;
    }
  >();
  for (const facility of args.facilities) {
    const time = facilityTime(facility, range);
    const cell = (local: Temporal.ZonedDateTime) => {
      const key = [
        facility.id,
        local.yearOfWeek,
        local.weekOfYear,
        local.dayOfWeek,
        local.hour,
      ].join("|");
      let value = cells.get(key);
      if (!value)
        cells.set(
          key,
          (value = {
            facilityId: facility.id,
            isoYear: local.yearOfWeek ?? local.year,
            isoWeek: local.weekOfYear ?? 1,
            weekday: local.dayOfWeek,
            hour: local.hour,
            booked: 0,
            open: 0,
            noShow: 0,
          }),
        );
      return value;
    };
    for (const span of time.open)
      byLocalHour(span, args.timezone, (local, value) => {
        cell(local).open += value * time.units;
      });
    for (const span of time.booked)
      byLocalHour(span, args.timezone, (local, value) => {
        cell(local).booked += value;
      });
    for (const span of time.noShows)
      byLocalHour(span, args.timezone, (local, value) => {
        cell(local).noShow += value;
      });
  }
  const order = new Map(
    args.facilities.map((facility, index) => [facility.id, index]),
  );
  return [...cells.values()]
    .filter((value) => value.open > 0)
    .map(({ booked, open, noShow, ...key }) => ({
      ...key,
      ...figures(booked, open),
      noShowMinutes: Math.round(noShow),
    }))
    .sort(
      (a, b) =>
        (order.get(a.facilityId) ?? 0) - (order.get(b.facilityId) ?? 0) ||
        a.isoYear - b.isoYear ||
        a.isoWeek - b.isoWeek ||
        a.weekday - b.weekday ||
        a.hour - b.hour,
    );
}
/**
 * Booked against open time for the local dates from–to (inclusive). Open time is the calendar
 * while the facility was active, minus municipal holidays; only bookings inside it count towards
 * occupancy, while booking counts include every booking starting in the range.
 */
export function occupancyReport(args: {
  timezone: string;
  from: Temporal.PlainDate;
  to: Temporal.PlainDate;
  facilities: FacilityActivity[];
}): OccupancyReport {
  const range = localRange(args.timezone, args.from, args.to);
  const cells = new Map<string, { booked: number; open: number }>();
  const cell = (weekday: number, hour: number) => {
    const key = `${weekday}-${hour}`;
    let value = cells.get(key);
    if (!value) cells.set(key, (value = { booked: 0, open: 0 }));
    return value;
  };
  const byFacility = args.facilities.map((facility): FacilityReport => {
    const { open, units, booked } = facilityTime(facility, range);
    for (const span of open)
      byLocalHour(span, args.timezone, (local, value) => {
        cell(local.dayOfWeek, local.hour).open += value * units;
      });
    for (const span of booked)
      byLocalHour(span, args.timezone, (local, value) => {
        cell(local.dayOfWeek, local.hour).booked += value;
      });
    const starting = facility.bookings.filter(
      (booking) =>
        compare(booking.start, range.start) >= 0 &&
        compare(booking.start, range.end) < 0,
    );
    return {
      id: facility.id,
      name: facility.name,
      sport: facility.sport,
      confirmed: starting.filter((booking) => booking.status === "confirmed")
        .length,
      cancelled: starting.filter((booking) => booking.status === "cancelled")
        .length,
      noShows: starting.filter((booking) => booking.status === "no_show")
        .length,
      ...figures(minutes(booked), minutes(open) * units),
    };
  });
  const heatmap = [...cells.entries()]
    .filter(([, value]) => value.open > 0)
    .map(([key, value]) => {
      const [weekday, hour] = key.split("-").map(Number);
      return { weekday, hour, ...figures(value.booked, value.open) };
    })
    .sort((a, b) => a.weekday - b.weekday || a.hour - b.hour);
  const sum = (
    key:
      "bookedMinutes" | "openMinutes" | "confirmed" | "cancelled" | "noShows",
  ) => byFacility.reduce((total, facility) => total + facility[key], 0);
  return {
    confirmed: sum("confirmed"),
    cancelled: sum("cancelled"),
    noShows: sum("noShows"),
    ...figures(sum("bookedMinutes"), sum("openMinutes")),
    byFacility,
    heatmap,
  };
}
