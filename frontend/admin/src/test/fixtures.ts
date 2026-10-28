// SPDX-License-Identifier: AGPL-3.0-or-later
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import type { Facility, Municipality } from "@/types/models";
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
  accessibility: {
    unit: "Servizo de Deportes do Concello de Vilaverde",
    email: "accesibilidade@vilaverde.example",
    phone: "+34 986 000 001",
    reviewedOn: "2026-10-27",
    method: "self",
    exceptions: {
      gl: "As descricións das instalacións aínda non se revisaron.",
      es: "Las descripciones de las instalaciones aún no se han revisado.",
    },
  },
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
  latitude: 42.61,
  longitude: -8.12,
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
