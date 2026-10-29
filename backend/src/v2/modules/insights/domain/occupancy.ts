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
  /** Courts and spaces in service, with their active units; reported one by one. */
  resources?: readonly {
    id: string;
    name: string;
    parentId: string | null;
    unitIds: readonly string[];
  }[];
  /** Opening intervals from the facility calendar. */
  open: Span[];
  /** When the facility was in service (status `active`). */
  active: Span[];
  /** Municipal holidays the facility follows, as whole local days. */
  closed: Span[];
  /**
   * A no-show held the slot but was not used, so it counts apart and not as booked time. A club's
   * season slot (#17) is occupied time but not a booking, so it adds minutes and no count.
   */
  bookings: (Span & {
    status: "confirmed" | "cancelled" | "no_show" | "season";
    unitIds?: readonly string[];
    /** The court booked; counts go to it, booked time to every unit it occupies. */
    resourceId?: string;
  })[];
}
export interface Figures {
  bookedMinutes: number;
  openMinutes: number;
  /** Booked over open time, rounded percent; null when the facility was never open. */
  occupancy: number | null;
}
interface Counts {
  confirmed: number;
  cancelled: number;
  noShows: number;
}
export interface ResourceReport extends Figures, Counts {
  id: string;
  name: string;
  parentId: string | null;
}
export interface FacilityReport extends Figures, Counts {
  id: string;
  name: string;
  sport: string;
  /** Each court in service: a whole court aggregates its parts' time. */
  byResource: ResourceReport[];
}
export interface HeatmapCell extends Figures {
  /** ISO weekday, 1 = Monday. */
  weekday: number;
  /** Local hour, 0–23. */
  hour: number;
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
  add: (weekday: number, hour: number, minutes: number) => void,
) {
  let cursor = span.start;
  while (compare(cursor, span.end) < 0) {
    const local = cursor.toZonedDateTimeISO(timezone);
    const boundary = local
      .round({ smallestUnit: "hour", roundingMode: "floor" })
      .add({ hours: 1 })
      .toInstant();
    const end = earlier(boundary, span.end);
    add(local.dayOfWeek, local.hour, end.since(cursor).total("minutes"));
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
  const range: Span = {
    start: args.from.toZonedDateTime(args.timezone).toInstant(),
    end: args.to.add({ days: 1 }).toZonedDateTime(args.timezone).toInstant(),
  };
  const cells = new Map<string, { booked: number; open: number }>();
  const cell = (weekday: number, hour: number) => {
    const key = `${weekday}-${hour}`;
    let value = cells.get(key);
    if (!value) cells.set(key, (value = { booked: 0, open: 0 }));
    return value;
  };
  const byFacility = args.facilities.map((facility): FacilityReport => {
    const open = subtract(
      intersect(intersect(facility.open, facility.active), [range]),
      facility.closed,
    );
    const unitIds = facility.unitIds ?? [facility.id];
    // Union overlaps within each unit only; simultaneous independent courts count separately.
    const bookedIn = (units: readonly string[]) =>
      units.flatMap((unitId) =>
        intersect(
          facility.bookings.filter(
            (booking) =>
              (booking.status === "confirmed" || booking.status === "season") &&
              (booking.unitIds ?? [facility.id]).includes(unitId),
          ),
          open,
        ),
      );
    const booked = bookedIn(unitIds);
    for (const span of open)
      byLocalHour(span, args.timezone, (weekday, hour, value) => {
        cell(weekday, hour).open += value * unitIds.length;
      });
    for (const span of booked)
      byLocalHour(span, args.timezone, (weekday, hour, value) => {
        cell(weekday, hour).booked += value;
      });
    const starting = facility.bookings.filter(
      (booking) =>
        compare(booking.start, range.start) >= 0 &&
        compare(booking.start, range.end) < 0,
    );
    const counts = (bookings: typeof starting): Counts => ({
      confirmed: bookings.filter((booking) => booking.status === "confirmed")
        .length,
      cancelled: bookings.filter((booking) => booking.status === "cancelled")
        .length,
      noShows: bookings.filter((booking) => booking.status === "no_show")
        .length,
    });
    const byResource = (facility.resources ?? [])
      .filter((resource) => resource.unitIds.length)
      .map((resource): ResourceReport => ({
        id: resource.id,
        name: resource.name,
        parentId: resource.parentId,
        ...counts(
          starting.filter((booking) => booking.resourceId === resource.id),
        ),
        ...figures(
          minutes(bookedIn(resource.unitIds)),
          minutes(open) * resource.unitIds.length,
        ),
      }));
    return {
      id: facility.id,
      name: facility.name,
      sport: facility.sport,
      ...counts(starting),
      ...figures(minutes(booked), minutes(open) * unitIds.length),
      byResource,
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
