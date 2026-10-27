// SPDX-License-Identifier: AGPL-3.0-or-later
export type AccessibilityMethod = "self" | "external";
export interface AccessibilitySettings {
  unit: string;
  email: string;
  phone: string;
  /** Last review of the statement as an ISO calendar date. */
  reviewedOn: string;
  method: AccessibilityMethod;
  exceptions: { gl: string; es: string };
}
export type MunicipalityLocale = "gl" | "es";
export interface LegalTexts {
  gl: string;
  es: string;
}
export interface MunicipalitySettings {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  /** Default interface language; a person's own choice takes precedence. */
  locale: MunicipalityLocale;
  advanceDays: number;
  cancellationHours: number;
  maxActiveBookings: number;
  contact: string;
  /** Privacy notice of the current legalVersion. */
  legalTexts: LegalTexts;
  legalVersion: string;
  retentionMonths: number;
  /** Lead time of the single booking reminder. */
  reminderHours: number;
  /** Display name for outgoing email; blank means the municipality name. */
  mailSenderName: string;
  /** Reply-To for outgoing email; blank means the general contact. */
  mailReplyTo: string;
  primaryColor: string;
  /** RFC 5545 VCALENDAR of all-day municipal holidays; empty when none. */
  holidaysCalendar: string;
  /** Content hash prefix of the uploaded logo, or null when there is none. */
  logoVersion: string | null;
  /** No-shows within the window that block new bookings; 0 disables the penalty. */
  noShowLimit: number;
  noShowWindowDays: number;
  noShowBlockDays: number;
  accessibility: AccessibilitySettings;
}
export abstract class Municipalities {
  abstract list(): Promise<MunicipalitySettings[]>;
  abstract find(id: string): Promise<MunicipalitySettings | null>;
  abstract findBySlug(slug: string): Promise<MunicipalitySettings | null>;
}
