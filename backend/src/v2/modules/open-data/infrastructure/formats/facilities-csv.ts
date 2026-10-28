// SPDX-License-Identifier: AGPL-3.0-or-later
import { facilityColumns, facilityRecord, Publication } from "./publication";
/** RFC 4180: comma separator, CRLF line ends, quotes only where needed, no BOM. */
export function facilitiesCsv(publication: Publication) {
  const rows = publication.data.facilities.map((facility) => {
    const record = facilityRecord(facility, publication);
    return facilityColumns.map((column) => cell(record[column]));
  });
  return (
    [facilityColumns, ...rows].map((row) => row.join(",")).join("\r\n") + "\r\n"
  );
}
function cell(value: string | number | boolean | null) {
  if (value === null) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
