// SPDX-License-Identifier: AGPL-3.0-or-later
export interface MunicipalitySettings {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  locale: string;
  advanceDays: number;
  cancellationHours: number;
  maxActiveBookings: number;
  contact: string;
  legalText: string;
  legalVersion: string;
  retentionMonths: number;
  /** Lead time of the single booking reminder. */
  reminderHours: number;
  /** Display name for outgoing email; blank means the municipality name. */
  mailSenderName: string;
  /** Reply-To for outgoing email; blank means the general contact. */
  mailReplyTo: string;
}
export abstract class Municipalities {
  abstract list(): Promise<MunicipalitySettings[]>;
  abstract find(id: string): Promise<MunicipalitySettings | null>;
  abstract findBySlug(slug: string): Promise<MunicipalitySettings | null>;
}
