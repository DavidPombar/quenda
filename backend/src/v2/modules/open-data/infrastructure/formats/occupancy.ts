// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
import type { OpenOccupancy } from "../../domain/open-occupancy.read-model";
import { Publication, occupancyFiles } from "./publication";
import { csvCell } from "./facilities-csv";
/** Monday of an ISO 8601 week: week 1 is the one that contains 4 January. */
export function isoWeekStart(isoYear: number, isoWeek: number) {
  const fourth = Temporal.PlainDate.from({ year: isoYear, month: 1, day: 4 });
  return fourth
    .subtract({ days: fourth.dayOfWeek - 1 })
    .add({ weeks: isoWeek - 1 });
}
/** One flat record per cell, shared by the CSV columns and the JSON items. */
export function occupancyRecords(publication: Publication<OpenOccupancy>) {
  const facilities = new Map(
    publication.data.facilities.map((facility) => [facility.id, facility]),
  );
  return publication.data.cells.map((cell) => {
    const facility = facilities.get(cell.facilityId);
    return {
      facility_id: cell.facilityId,
      facility_name: facility?.name ?? "",
      sport: facility?.sport ?? "",
      iso_year: cell.isoYear,
      iso_week: cell.isoWeek,
      week_start: isoWeekStart(cell.isoYear, cell.isoWeek).toString(),
      weekday: cell.weekday,
      hour: cell.hour,
      open_minutes: cell.openMinutes,
      booked_minutes: cell.bookedMinutes,
      no_show_minutes: cell.noShowMinutes,
      occupancy_pct: cell.occupancy ?? 0,
    };
  });
}
export type OccupancyRecord = ReturnType<typeof occupancyRecords>[number];
export const occupancyColumns: (keyof OccupancyRecord)[] = [
  "facility_id",
  "facility_name",
  "sport",
  "iso_year",
  "iso_week",
  "week_start",
  "weekday",
  "hour",
  "open_minutes",
  "booked_minutes",
  "no_show_minutes",
  "occupancy_pct",
];
export function occupancyJson(publication: Publication<OpenOccupancy>) {
  const { municipality, generatedOn, timezone, from, to } = publication.data;
  return {
    $schema: publication.schema("occupancy.schema.json"),
    id: publication.file(occupancyFiles.json.file),
    title: `${municipality.name}: ocupación das instalacións deportivas`,
    publisher: municipality.name,
    license: publication.license.url,
    generated_on: generatedOn,
    timezone,
    from,
    to,
    cells: occupancyRecords(publication),
  };
}
/** RFC 4180 like facilities.csv: comma, CRLF, quotes only where needed, no BOM. */
export function occupancyCsv(publication: Publication<OpenOccupancy>) {
  const rows = occupancyRecords(publication).map((record) =>
    occupancyColumns.map((column) => csvCell(record[column])),
  );
  return (
    [occupancyColumns, ...rows].map((row) => row.join(",")).join("\r\n") +
    "\r\n"
  );
}
