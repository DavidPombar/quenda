// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { EnrolmentExport } from "../../application/commands/export-activity-enrolments.command";
import type { EnrolmentStatus } from "../../domain/enrolment.entity";
type Locale = "gl" | "es";
const TEXT = {
  gl: {
    status: "Estado",
    position: "Posición na lista de espera",
    name: "Persoa que inscribe",
    email: "Correo electrónico",
    participant: "Participante",
    age: "Idade",
    created: "Data de inscrición",
    enrolled: "Data con praza",
    ended: "Data de baixa",
    reason: "Motivo da baixa",
    statuses: {
      enrolled: "Inscrita",
      waiting: "En lista de espera",
      left: "Deuse de baixa",
      removed: "Baixa polo concello",
      cancelled: "Actividade anulada",
    },
  },
  es: {
    status: "Estado",
    position: "Posición en la lista de espera",
    name: "Persona que inscribe",
    email: "Correo electrónico",
    participant: "Participante",
    age: "Edad",
    created: "Fecha de inscripción",
    enrolled: "Fecha con plaza",
    ended: "Fecha de baja",
    reason: "Motivo de la baja",
    statuses: {
      enrolled: "Inscrita",
      waiting: "En lista de espera",
      left: "Se dio de baja",
      removed: "Baja por el ayuntamiento",
      cancelled: "Actividad anulada",
    },
  },
} as const satisfies Record<
  Locale,
  { statuses: Record<EnrolmentStatus, string> } & Record<string, unknown>
>;
/**
 * Quotes what needs it and neutralises text a spreadsheet would run as a formula, since names
 * are typed by the people themselves (CSV injection, T4).
 */
function cell(value: string | number | null) {
  let text = value === null ? "" : String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[";\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
/**
 * The people of an activity as CSV for the municipality: UTF-8 with BOM and `;` separators, open
 * enrolments first, dates and times local to the municipality.
 */
export function enrolmentsCsv(value: EnrolmentExport, locale: Locale) {
  const t = TEXT[locale];
  const local = (instant: Temporal.Instant | null) =>
    instant
      ?.toZonedDateTimeISO(value.timezone)
      .toPlainDateTime()
      .toString({ smallestUnit: "minute" })
      .replace("T", " ") ?? null;
  const rows: (string | number | null)[][] = [
    [value.activity.name[locale] || value.activity.name.gl],
    [],
    [
      t.status,
      t.position,
      t.name,
      t.email,
      t.participant,
      t.age,
      t.created,
      t.enrolled,
      t.ended,
      t.reason,
    ],
    ...value.enrolments.map((entry) => [
      t.statuses[entry.status],
      entry.position,
      entry.name,
      entry.email,
      entry.participantFirstName,
      entry.participantAge,
      local(entry.createdAt),
      local(entry.enrolledAt),
      local(entry.endedAt),
      entry.removalReason,
    ]),
  ];
  return "﻿" + rows.map((row) => row.map(cell).join(";")).join("\r\n") + "\r\n";
}
