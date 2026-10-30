// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type {
  LegalTexts,
  MunicipalitySettings,
} from "../../../shared/application/municipality-settings";
import type { Logo } from "./logo";
export type EditableSettings = Pick<
  MunicipalitySettings,
  | "locale"
  | "advanceDays"
  | "cancellationHours"
  | "maxActiveBookings"
  | "contact"
  | "primaryColor"
  | "holidaysCalendar"
  | "enabledCategories"
  | "noShowLimit"
  | "noShowWindowDays"
  | "noShowBlockDays"
  | "dataLicense"
  | "dir3Code"
  | "analyticsEnabled"
>;
export abstract class MunicipalitySettingsRepository {
  /** Serialises concurrent edits of one municipality within the current transaction. */
  abstract lock(tenantId: string): Promise<void>;
  /** Writes only the given fields, so concurrent edits of other sections are kept. */
  abstract save(
    tenantId: string,
    changes: Partial<EditableSettings>,
  ): Promise<void>;
  /** Appends a privacy notice version dated `date` and makes it current; returns the version. */
  abstract publishLegalTexts(
    tenantId: string,
    texts: LegalTexts,
    date: Temporal.PlainDate,
    publishedAt: Temporal.Instant,
  ): Promise<string>;
  /** Starts of confirmed future bookings in facilities that follow municipal holidays. */
  abstract upcomingHolidayExposedStarts(
    tenantId: string,
    now: Temporal.Instant,
  ): Promise<Temporal.Instant[]>;
  abstract saveLogo(
    tenantId: string,
    logo: Logo,
    updatedAt: Temporal.Instant,
  ): Promise<void>;
  abstract deleteLogo(tenantId: string): Promise<boolean>;
  abstract findLogo(slug: string): Promise<(Logo & { version: string }) | null>;
}
