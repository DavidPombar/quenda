// SPDX-License-Identifier: AGPL-3.0-or-later
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import type {
  Account,
  AuthMethods,
  Availability,
  Facility,
  Municipality,
  Slot,
} from "@/types/models";
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
  retentionMonths: 24,
  reminderHours: 24,
  primaryColor: "#1f5b43",
  logoUrl: null,
  noShowLimit: 3,
  noShowWindowDays: 30,
  noShowBlockDays: 7,
  dataLicense: "CC-BY-4.0",
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
  // V0 facility: one court with the facility's id and name.
  resources: [
    {
      id: "20000000-0000-4000-8000-000000000011",
      name: "Pistas de pádel da Carballeira",
      parentId: null,
      active: true,
      position: 0,
    },
  ],
};
/** Divisible hall: full court with thirds; the third third is out of service. */
export const pavilion: Facility = {
  ...facility,
  id: "20000000-0000-4000-8000-000000000012",
  name: "Pavillón municipal",
  sport: "futsal",
  resources: [
    {
      id: "20000000-0000-4000-8000-000000000012",
      name: "Pista completa",
      parentId: null,
      active: true,
      position: 0,
    },
    {
      id: "30000000-0000-4000-8000-000000000003",
      name: "Tercio C",
      parentId: "20000000-0000-4000-8000-000000000012",
      active: false,
      position: 3,
    },
    {
      id: "30000000-0000-4000-8000-000000000001",
      name: "Tercio A",
      parentId: "20000000-0000-4000-8000-000000000012",
      active: true,
      position: 1,
    },
    {
      id: "30000000-0000-4000-8000-000000000002",
      name: "Tercio B",
      parentId: "20000000-0000-4000-8000-000000000012",
      active: true,
      position: 2,
    },
  ],
};
/** Availability in the API shape; inactive courts have no slots. */
export function availabilityFor(
  target: Facility,
  slotsFor: (resourceId: string) => Slot[],
): Availability {
  return {
    resources: target.resources.map((resource) => ({
      id: resource.id,
      name: resource.name,
      parentId: resource.parentId,
      active: resource.active,
      slots: resource.active ? slotsFor(resource.id) : [],
    })),
  };
}
export function stubAvailability(
  target: Facility,
  slotsFor: (resourceId: string) => Slot[],
) {
  return stubJsonResponse({
    path: `*/v2/public/availability/${target.id}`,
    response: availabilityFor(target, slotsFor),
  });
}
export const authMethods: AuthMethods = {
  demo: true,
  oidc: null,
  email: false,
};
export function stubAuthMethods(overrides: Partial<AuthMethods> = {}) {
  const response = { ...authMethods, ...overrides };
  stubJsonResponse({ path: "*/v2/public/auth/methods", response });
  return response;
}
export function stubShell(
  authenticated = false,
  methods: Partial<AuthMethods> = {},
) {
  stubAuthMethods(methods);
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
  // A signed-in shell remembers the language the person uses for outgoing email.
  if (authenticated)
    stubJsonResponse({
      path: "*/v2/citizen/me",
      method: "PATCH",
      response: {},
    });
  stubJsonResponse({
    path: "*/v2/public/facilities",
    response: [facility, pavilion],
  });
}
export const account: Account = {
  userId: "10000000-0000-4000-8000-000000000011",
  displayName: "Alex",
  role: "citizen",
  currentLegalVersion: municipality.legalVersion,
  consentUpToDate: true,
  consents: [
    {
      legalVersion: municipality.legalVersion,
      acceptedAt: "2026-10-18T09:30:00Z",
    },
  ],
  bookings: 2,
  notifications: 3,
  email: "alex@vilaverde.example",
  locale: "gl",
  reminderEmails: true,
};
export function stubAccount(overrides: Partial<Account> = {}) {
  const response = { ...account, ...overrides };
  stubJsonResponse({ path: "*/v2/citizen/me", response });
  return response;
}
