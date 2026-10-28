// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
import type { Locale } from "@/types/models";
const LOCALE_TAGS: Record<Locale, string> = { gl: "gl-ES", es: "es-ES" };
// Some browser builds ship without Galician ICU data and silently fall back to
// English, so Galician names are provided here when Intl cannot supply them.
const GL_WEEKDAYS_SHORT = ["luns", "mar", "mér", "xov", "ven", "sáb", "dom"];
const GL_WEEKDAYS = [
  "luns",
  "martes",
  "mércores",
  "xoves",
  "venres",
  "sábado",
  "domingo",
];
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
const GL_MONTHS_SHORT = [
  "xan",
  "feb",
  "mar",
  "abr",
  "maio",
  "xuñ",
  "xul",
  "ago",
  "set",
  "out",
  "nov",
  "dec",
];
function intlSupports(locale: Locale) {
  return (
    Intl.DateTimeFormat.supportedLocalesOf([LOCALE_TAGS[locale]]).length > 0
  );
}
function plainDate(instant: string, timezone: string) {
  return Temporal.Instant.from(instant)
    .toZonedDateTimeISO(timezone)
    .toPlainDate();
}
function capitalise(text: string) {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}
export function today(timezone: string) {
  return Temporal.Now.plainDateISO(timezone).toString();
}
export function timeLabel(instant: string, timezone: string) {
  return Temporal.Instant.from(instant)
    .toZonedDateTimeISO(timezone)
    .toPlainTime()
    .toString({ smallestUnit: "minute" });
}
// "18 de outubro de 2026"
export function dateLabel(instant: string, timezone: string, locale: Locale) {
  const date = plainDate(instant, timezone);
  if (locale === "gl" && !intlSupports("gl"))
    return `${date.day} de ${GL_MONTHS[date.month - 1]} de ${date.year}`;
  return date.toLocaleString(LOCALE_TAGS[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
// "Domingo, 18 de outubro"
export function longDayLabel(date: string, locale: Locale) {
  const value = Temporal.PlainDate.from(date);
  if (locale === "gl" && !intlSupports("gl"))
    return capitalise(
      `${GL_WEEKDAYS[value.dayOfWeek - 1]}, ${value.day} de ${GL_MONTHS[value.month - 1]}`,
    );
  return capitalise(
    value.toLocaleString(LOCALE_TAGS[locale], {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  );
}
export function bookingDayLabel(
  instant: string,
  timezone: string,
  locale: Locale,
) {
  return longDayLabel(plainDate(instant, timezone).toString(), locale);
}
// Parts for compact day chips: { weekday: "xov", day: "22", month: "out" }.
export function dayParts(date: string, locale: Locale) {
  const value = Temporal.PlainDate.from(date);
  if (locale === "gl" && !intlSupports("gl"))
    return {
      weekday: GL_WEEKDAYS_SHORT[value.dayOfWeek - 1],
      day: String(value.day),
      month: GL_MONTHS_SHORT[value.month - 1],
    };
  const tag = LOCALE_TAGS[locale];
  const clean = (text: string) => text.replace(".", "");
  return {
    weekday: clean(value.toLocaleString(tag, { weekday: "short" })),
    day: String(value.day),
    month: clean(value.toLocaleString(tag, { month: "short" })),
  };
}
export function money(cents: number, locale: Locale) {
  // Galician and Spanish share the euro format ("3,00 €").
  const tag = intlSupports(locale) ? LOCALE_TAGS[locale] : LOCALE_TAGS.es;
  return new Intl.NumberFormat(tag, {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
// "27 de outubro de 2026"
export function fullDateLabel(date: string, locale: Locale) {
  const value = Temporal.PlainDate.from(date);
  if (locale === "gl" && !intlSupports("gl"))
    return `${value.day} de ${GL_MONTHS[value.month - 1]} de ${value.year}`;
  return value.toLocaleString(LOCALE_TAGS[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
