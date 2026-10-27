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
  /** Residency verification is enabled: the NIF from eID sign-in is kept, encrypted. */
  storeNif: boolean;
}
export abstract class Municipalities {
  abstract list(): Promise<MunicipalitySettings[]>;
  abstract find(id: string): Promise<MunicipalitySettings | null>;
  abstract findBySlug(slug: string): Promise<MunicipalitySettings | null>;
}
