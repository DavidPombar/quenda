// SPDX-License-Identifier: AGPL-3.0-or-later
import { Insights } from "../../application/queries/get-insights.query";
type Locale = "gl" | "es";
const TEXT = {
  gl: {
    period: "Período",
    facility: "Instalación",
    sport: "Deporte",
    confirmed: "Reservas confirmadas",
    cancelled: "Reservas canceladas",
    noShows: "Non presentadas",
    waitlistAccepted: "Ofertas da lista de espera aceptadas",
    waitlistExpired: "Ofertas da lista de espera caducadas",
    booked: "Horas reservadas",
    open: "Horas abertas",
    occupancy: "Ocupación (%)",
    total: "Total",
    weekday: "Día da semana",
    hour: "Hora",
    days: [
      "Luns",
      "Martes",
      "Mércores",
      "Xoves",
      "Venres",
      "Sábado",
      "Domingo",
    ],
  },
  es: {
    period: "Periodo",
    facility: "Instalación",
    sport: "Deporte",
    confirmed: "Reservas confirmadas",
    cancelled: "Reservas canceladas",
    noShows: "No presentadas",
    waitlistAccepted: "Ofertas de la lista de espera aceptadas",
    waitlistExpired: "Ofertas de la lista de espera caducadas",
    booked: "Horas reservadas",
    open: "Horas abiertas",
    occupancy: "Ocupación (%)",
    total: "Total",
    weekday: "Día de la semana",
    hour: "Hora",
    days: [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ],
  },
} as const;
function cell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return /[";\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
/** Hours with one decimal and a decimal comma, as spreadsheets in Galicia and Spain expect. */
const hours = (minutes: number) => (minutes / 60).toFixed(1).replace(".", ",");
/**
 * Aggregated, anonymous indicators as CSV: UTF-8 with BOM and `;` separators so spreadsheet
 * software opens it directly. Blocks: period, facilities with total, weekday × hour.
 */
export function insightsCsv(insights: Insights, locale: Locale) {
  const t = TEXT[locale];
  const rows: (string | number | null)[][] = [
    [t.period, insights.from, insights.to],
    [],
    [
      t.facility,
      t.sport,
      t.confirmed,
      t.cancelled,
      t.noShows,
      t.booked,
      t.open,
      t.occupancy,
    ],
    ...insights.byFacility.map((facility) => [
      facility.name,
      facility.sport,
      facility.confirmed,
      facility.cancelled,
      facility.noShows,
      hours(facility.bookedMinutes),
      hours(facility.openMinutes),
      facility.occupancy,
    ]),
    [
      t.total,
      null,
      insights.confirmed,
      insights.cancelled,
      insights.noShows,
      hours(insights.bookedMinutes),
      hours(insights.openMinutes),
      insights.occupancy,
    ],
    [],
    [t.waitlistAccepted, insights.waitlistAccepted],
    [t.waitlistExpired, insights.waitlistExpired],
    [],
    [t.weekday, t.hour, t.booked, t.open, t.occupancy],
    ...insights.heatmap.map((value) => [
      t.days[value.weekday - 1],
      `${String(value.hour).padStart(2, "0")}:00`,
      hours(value.bookedMinutes),
      hours(value.openMinutes),
      value.occupancy,
    ]),
  ];
  return "﻿" + rows.map((row) => row.map(cell).join(";")).join("\r\n") + "\r\n";
}
