// SPDX-License-Identifier: AGPL-3.0-or-later
export interface Facility {
  id: string;
  tenantId: string;
  name: string;
  sport: "padel" | "tennis" | "futsal" | "swimming";
  address: string;
  description: string;
  accessible: boolean;
  status: "active" | "maintenance" | "closed";
  slotMinutes: number;
  priceCents: number;
  openingCalendar: string;
  rules: string;
  /** Whether the municipal holiday calendar closes this facility. */
  followsMunicipalHolidays: boolean;
  /** WGS 84 position; both set or both null. */
  latitude: number | null;
  longitude: number | null;
}
