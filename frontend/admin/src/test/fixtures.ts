// SPDX-License-Identifier: AGPL-3.0-or-later
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import type { Facility, Insights, Municipality } from "@/types/models";
export const municipality: Municipality = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "vilaverde",
  name: "Concello de Vilaverde",
  timezone: "Europe/Madrid",
  locale: "gl",
  advanceDays: 14,
  cancellationHours: 2,
  maxActiveBookings: 5,
  contact: "deportes@vilaverde.example",
  legalTexts: {
    gl: "Demostración con datos ficticios.",
    es: "Demostración con datos ficticios en castellano.",
  },
  legalVersion: "2026-10",
  primaryColor: "#1f5b43",
  logoUrl: null,
  noShowLimit: 3,
  noShowWindowDays: 30,
  noShowBlockDays: 7,
};
export const facility: Facility = {
  id: "20000000-0000-4000-8000-000000000011",
  name: "Pistas de pádel da Carballeira",
  sport: "padel",
  address: "Rúa da Carballeira, 12",
  description: "Un espazo para xogar.",
  accessible: true,
  status: "active",
  slotMinutes: 60,
  priceCents: 400,
  openingCalendar: "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR",
  rules: "Trae calzado deportivo.",
  followsMunicipalHolidays: true,
};
export function stubShell(authenticated = false) {
  stubJsonResponse({
    path: "*/v2/public/municipalities",
    response: [municipality],
  });
  stubJsonResponse({
    path: "*/v2/public/session",
    response: {
      session: authenticated
        ? {
            userId: "10000000-0000-4000-8000-000000000011",
            tenantId: municipality.id,
            displayName: "Alex",
            role: "citizen",
          }
        : null,
    },
  });
  stubJsonResponse({
    path: "*/v2/public/facilities",
    response: [
      facility,
      {
        ...facility,
        id: "20000000-0000-4000-8000-000000000012",
        name: "Pavillón municipal",
        sport: "futsal",
      },
    ],
  });
}
export function insightsFor(
  from: string,
  to: string,
  occupancy: number,
): Insights {
  return {
    from,
    to,
    total: 15,
    confirmed: 10,
    cancelled: 2,
    noShows: 3,
    bookedMinutes: 600,
    openMinutes: 6000,
    occupancy,
    facilities: 1,
    byFacility: [
      {
        id: facility.id,
        name: facility.name,
        sport: facility.sport,
        bookings: 10,
        confirmed: 10,
        cancelled: 2,
        noShows: 3,
        bookedMinutes: 600,
        openMinutes: 6000,
        occupancy,
      },
    ],
    heatmap: [
      {
        weekday: 1,
        hour: 18,
        bookedMinutes: 240,
        openMinutes: 300,
        occupancy: 80,
      },
      {
        weekday: 2,
        hour: 18,
        bookedMinutes: 0,
        openMinutes: 300,
        occupancy: 0,
      },
    ],
  };
}
