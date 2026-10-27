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
  accessibility: AccessibilitySettings;
}
export abstract class Municipalities {
  abstract list(): Promise<MunicipalitySettings[]>;
  abstract find(id: string): Promise<MunicipalitySettings | null>;
  abstract findBySlug(slug: string): Promise<MunicipalitySettings | null>;
}
