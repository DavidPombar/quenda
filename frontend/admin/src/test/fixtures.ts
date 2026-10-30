// SPDX-License-Identifier: AGPL-3.0-or-later
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import type {
  AuthMethods,
  SportInfo,
  Facility,
  Insights,
  Municipality,
  SiteReport,
  WebAnalytics,
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
  enabledCategories: [],
  noShowLimit: 3,
  noShowWindowDays: 30,
  noShowBlockDays: 7,
  dataLicense: "CC-BY-4.0",
  dir3Code: null,
  analytics: false,
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
  prices: [],
  openingCalendar: "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR",
  rules: "Trae calzado deportivo.",
  followsMunicipalHolidays: true,
  latitude: 42.61,
  longitude: -8.12,
};
/** Sports catalogue (#26): the four of V0 visible and one hidden. */
export const sports: SportInfo[] = [
  ["padel", "Pádel", false],
  ["tennis", "Tenis", false],
  ["futsal", "Fútbol sala", false],
  ["swimming", "Natación", false],
  ["basketball", "Baloncesto", true],
].map(([code, name, hidden], index) => ({
  code: code as string,
  name: { gl: name as string, es: name as string },
  cnidClass: "Pistas",
  cnidType: "Pista polideportiva",
  schemaType: "SportsActivityLocation",
  art: (["padel", "tennis", "futsal", "swimming"].includes(code as string)
    ? code
    : "generic") as SportInfo["art"],
  hidden: hidden as boolean,
  position: index + 1,
}));
/** Sign-in methods: the demo by default, staff accounts when asked (#8). */
export function stubAuthMethods(overrides: Partial<AuthMethods> = {}) {
  stubJsonResponse({
    path: "*/v2/public/auth/methods",
    response: {
      demo: true,
      oidc: null,
      email: false,
      local: false,
      ...overrides,
    },
  });
}
export function stubShell(authenticated = false) {
  stubAuthMethods();
  stubJsonResponse({ path: "*/v2/manager/sports", response: sports });
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
    path: "*/v2/manager/facilities",
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
        byResource: [],
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
export const siteReport: SiteReport = {
  visitors: 120,
  visits: 150,
  pageviews: 480,
  bounceRate: 35,
  averageVisitSeconds: 125,
  pages: [{ value: "/app/vilaverde/instalacions", count: 210 }],
  referrers: [{ value: "concello.vilaverde.gal", count: 40 }],
  devices: [{ value: "mobile", count: 90 }],
  languages: [{ value: "gl", count: 100 }],
  events: [{ value: "booking-confirmed", count: 18 }],
};
export function webAnalyticsFor(
  overrides: Partial<WebAnalytics> = {},
): WebAnalytics {
  return {
    available: true,
    enabled: true,
    from: "2026-10-01",
    to: "2026-10-31",
    app: siteReport,
    web: null,
    municipalities: [],
    ...overrides,
  };
}
