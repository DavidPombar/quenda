// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
import type { Locale } from "@/types/models";
export function today(timezone: string) {
  return Temporal.Now.plainDateISO(timezone).toString();
}
export function timeLabel(instant: string, timezone: string) {
  return Temporal.Instant.from(instant)
    .toZonedDateTimeISO(timezone)
    .toPlainTime()
    .toString({ smallestUnit: "minute" });
}
export function dateLabel(instant: string, timezone: string, locale: Locale) {
  return Temporal.Instant.from(instant)
    .toZonedDateTimeISO(timezone)
    .toPlainDate()
    .toLocaleString(intlLocale(locale), {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
}
export function dayLabel(date: string, locale: Locale) {
  return Temporal.PlainDate.from(date).toLocaleString(intlLocale(locale), {
    weekday: "short",
    day: "numeric",
  });
}
// Some browser builds ship without Galician ICU data and would fall back to English.
// Numbers and money share the Spanish format ("3,00 €"); month names do not, so
// periods use the Galician names below.
const GALICIAN_SUPPORTED =
  Intl.DateTimeFormat.supportedLocalesOf("gl-ES").length > 0;
export function intlLocale(locale: Locale) {
  return locale === "es" || !GALICIAN_SUPPORTED ? "es-ES" : "gl-ES";
}
// Describes an inclusive range of ISO plain dates as part of a sentence:
// "do 16 ao 22 de outubro" (gl), "del 28 de octubre al 3 de noviembre" (es).
export function periodLabel(from: string, to: string, locale: Locale) {
  const start = Temporal.PlainDate.from(from);
  const end = Temporal.PlainDate.from(to);
  const month = (date: Temporal.PlainDate) =>
    locale === "gl" && !GALICIAN_SUPPORTED
      ? GL_MONTHS[date.month - 1]
      : new Intl.DateTimeFormat(intlLocale(locale), {
          month: "long",
          timeZone: "UTC",
        }).format(new Date(Date.UTC(date.year, date.month - 1, 1)));
  const [fromWord, toWord] = locale === "es" ? ["del", "al"] : ["do", "ao"];
  const first =
    start.month === end.month && start.year === end.year
      ? `${start.day}`
      : `${start.day} de ${month(start)}`;
  return `${fromWord} ${first} ${toWord} ${end.day} de ${month(end)}`;
}
export function money(cents: number, locale: Locale) {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
const GL_MONTHS = [
  "xaneiro",
  "febreiro",
  "marzo",
  "abril",
  "maio",
  "xuño",
  "xullo",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "decembro",
];
