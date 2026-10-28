// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type {
  LegalTexts,
  MunicipalityLocale,
} from "../../../shared/application/municipality-settings";
export interface NewMunicipality {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  locale: MunicipalityLocale;
  contact: string;
  advanceDays: number;
  cancellationHours: number;
  maxActiveBookings: number;
  legalTexts: LegalTexts;
  legalVersion: string;
  publishedAt: Temporal.Instant;
}
/** Municipal staff the operator manages; never citizens. */
export interface StaffMember {
  id: string;
  tenantId: string;
  displayName: string;
  email: string | null;
}
export interface FacilityCount {
  tenantId: string;
  total: number;
  active: number;
}
/** Deployment-wide reads and writes; only configuration and staff, never personal data. */
export abstract class DeploymentRepository {
  abstract slugTaken(slug: string): Promise<boolean>;
  abstract createMunicipality(value: NewMunicipality): Promise<void>;
  abstract managers(): Promise<StaffMember[]>;
  abstract facilityCounts(): Promise<FacilityCount[]>;
  abstract findUser(
    id: string,
  ): Promise<(StaffMember & { role: string }) | null>;
  abstract createManager(value: StaffMember): Promise<void>;
}
