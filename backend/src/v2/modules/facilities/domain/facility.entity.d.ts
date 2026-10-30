// SPDX-License-Identifier: AGPL-3.0-or-later
import type { CategoryPrice } from "../../../shared/application/categories";
export interface Facility {
  id: string;
  tenantId: string;
  name: string;
  /** Code of a sport in the municipality's catalogue. */
  sport: string;
  address: string;
  description: string;
  accessible: boolean;
  status: "active" | "maintenance" | "closed";
  slotMinutes: number;
  /** General tariff, paid by anyone without a verified category that has its own price. */
  priceCents: number;
  /** Prices for user categories, in catalogue order (M2). */
  prices: CategoryPrice[];
  openingCalendar: string;
  rules: string;
  /** Whether the municipal holiday calendar closes this facility. */
  followsMunicipalHolidays: boolean;
  /** WGS 84 position; both set or both null. */
  latitude: number | null;
  longitude: number | null;
}
