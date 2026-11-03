// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { page, commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { facility, stubFacilities, stubShell } from "@/test/fixtures";
import type {
  MyEnrolment,
  PublicActivity,
  PublicActivityDetails,
} from "@/types/models";
const swimming: PublicActivity = {
  id: "60000000-0000-4000-8000-000000000011",
  facilityId: facility.id,
  facilityName: facility.name,
  facilityAddress: "Rúa do Río, 5",
  resourceId: facility.id,
  resourceName: "Rúa 2",
  sport: "swimming",
  sportName: { gl: "Natación", es: "Natación" },
  sportArt: "swimming",
  name: { gl: "Natación infantil", es: "Natación infantil" },
  description: { gl: "Iniciación para nenas e nenos.", es: "" },
  rule: {
    weekdays: [2, 4],
    startsLocal: "17:00",
    endsLocal: "18:00",
    startsOn: "2026-11-03",
    endsOn: "2027-06-24",
    exceptions: [],
  },
  places: 8,
  minAge: 6,
  maxAge: 12,
  enrolmentOpensOn: "2026-10-20",
  enrolmentClosesOn: "2026-11-15",
  prices: [
    { category: "general", priceCents: 3000 },
    { category: "resident", priceCents: 1500 },
  ],
  status: "published",
  cancellationReason: null,
  nextSession: "2026-11-03T16:00:00Z",
  enrolment: "open",
  freePlaces: 3,
  waiting: 0,
};
const details: PublicActivityDetails = {
  ...swimming,
  sessions: [
    {
      id: "61000000-0000-4000-8000-000000000001",
      start: "2026-11-03T16:00:00Z",
      end: "2026-11-03T17:00:00Z",
      status: "cancelled",
      cancellationReason: "Avaría na depuradora",
    },
    {
      id: "61000000-0000-4000-8000-000000000002",
      start: "2026-11-05T16:00:00Z",
      end: "2026-11-05T17:00:00Z",
      status: "active",
      cancellationReason: null,
    },
  ],
};
describe("Activities and sports schools", () => {
  test("should list the activities and send the filters to the server", async () => {
    stubShell();
    stubFacilities([facility]);
    const { spy } = stubJsonResponse({
      path: "*/v2/public/activities",
      response: { items: [swimming], total: 1, page: 1, pageSize: 12 },
    });
    await commands.navigate("/app/vilaverde/actividades");
    await render(<App />);
    await expect
      .element(
        page.getByRole("heading", {
          name: "Actividades e escolas deportivas",
          level: 1,
        }),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "Natación infantil" }))
      .toHaveAttribute("href", `/app/vilaverde/actividades/${swimming.id}`);
    await expect
      .element(page.getByText("martes e xoves, 17:00–18:00"))
      .toBeVisible();
    await expect.element(page.getByText("De 6 a 12 anos")).toBeVisible();
    await expect.element(page.getByText("1 actividade")).toBeVisible();
    await page
      .getByRole("checkbox", { name: "Só con inscrición aberta" })
      .click();
    await page
      .getByRole("spinbutton", { name: "Idade de quen vai participar" })
      .fill("9");
    await expect
      .poll(() => new URL(spy.mock.lastCall![0].url).searchParams.get("age"))
      .toBe("9");
    const params = new URL(spy.mock.lastCall![0].url).searchParams;
    expect(params.get("open")).toBe("true");
    expect(params.get("slug")).toBe("vilaverde");
  });
  test("should show an activity's schedule, prices and cancelled sessions", async () => {
    stubShell();
    stubFacilities([facility]);
    stubJsonResponse({
      path: "*/v2/public/activities/:id",
      response: details,
    });
    await commands.navigate(`/app/vilaverde/actividades/${swimming.id}`);
    await render(<App />);
    await expect
      .element(
        page.getByRole("heading", { name: "Natación infantil", level: 1 }),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("link", { name: facility.name }))
      .toHaveAttribute("href", `/app/vilaverde/instalacions/${facility.id}`);
    await expect
      .element(page.getByText("Anulada: Avaría na depuradora"))
      .toBeVisible();
    await expect.element(page.getByText("Persoa empadroada")).toBeVisible();
    await page.getByRole("button", { name: "ES", exact: true }).click();
    await expect
      .element(page.getByText("martes y jueves, 17:00–18:00"))
      .toBeVisible();
  });
  test("should enrol a signed-in adult after confirming, and show their place", async () => {
    stubShell(true);
    stubFacilities([facility]);
    const adults = { ...details, minAge: 16, maxAge: null };
    stubJsonResponse({ path: "*/v2/public/activities/:id", response: adults });
    const enrolled: MyEnrolment = {
      id: "62000000-0000-4000-8000-000000000001",
      activityId: swimming.id,
      activityName: swimming.name,
      activityStatus: "published",
      facilityId: facility.id,
      facilityName: facility.name,
      resourceName: "Rúa 2",
      status: "enrolled",
      participant: null,
      position: null,
      createdAt: "2026-10-21T10:00:00Z",
      enrolledAt: "2026-10-21T10:00:00Z",
      endedAt: null,
      nextSession: "2026-11-05T16:00:00Z",
      cancelledSessions: 0,
    };
    const { spy } = stubJsonResponse({
      path: "*/v2/citizen/activity-enrolments",
      method: "POST",
      status: 201,
      response: enrolled,
    });
    await commands.navigate(`/app/vilaverde/actividades/${swimming.id}`);
    await render(<App />);
    await expect.element(page.getByText("3 de 8 prazas libres")).toBeVisible();
    await page.getByRole("button", { name: "Inscribirme" }).click();
    const dialog = page.getByRole("dialog");
    await expect
      .element(
        dialog.getByRole("heading", {
          name: "Inscribirte en Natación infantil",
        }),
      )
      .toBeVisible();
    stubJsonResponse({
      path: "*/v2/citizen/activity-enrolments",
      response: [enrolled],
    });
    await dialog.getByRole("button", { name: "Confirmar inscrición" }).click();
    await expect
      .element(dialog.getByText("Xa estás inscrito ou inscrita."))
      .toBeVisible();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ activityId: swimming.id }),
      }),
    );
    await dialog.getByRole("button", { name: "Pechar" }).first().click();
    await expect
      .element(page.getByText("Estás inscrito ou inscrita nesta actividade."))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Darme de baixa" }))
      .toBeVisible();
  });
  test("should offer the waiting list when full and ask people to sign in first", async () => {
    stubShell();
    stubFacilities([facility]);
    stubJsonResponse({
      path: "*/v2/public/activities/:id",
      response: {
        ...details,
        minAge: 16,
        maxAge: null,
        enrolment: "full",
        freePlaces: 0,
        waiting: 2,
      },
    });
    await commands.navigate(`/app/vilaverde/actividades/${swimming.id}`);
    await render(<App />);
    await expect
      .element(
        page.getByText(
          "Non quedan prazas libres. Persoas na lista de espera: 2.",
        ),
      )
      .toBeVisible();
    await expect
      .element(
        page.getByRole("button", { name: "Inicia sesión para inscribirte" }),
      )
      .toBeVisible();
    await expect
      .element(page.getByText("Completa: lista de espera", { exact: false }))
      .toBeVisible();
  });
  test("should enrol a child in the adult's care of the right age, and say who cannot take part", async () => {
    stubShell(true);
    stubFacilities([facility]);
    stubJsonResponse({ path: "*/v2/public/activities/:id", response: details });
    const year = Number(details.rule.startsOn.slice(0, 4));
    stubJsonResponse({
      path: "*/v2/citizen/dependants",
      response: [
        {
          id: "63000000-0000-4000-8000-000000000001",
          firstName: "Uxía",
          birthYear: year - 9,
          declarationVersion: "2026-11",
          declaredAt: "2026-10-21T10:00:00Z",
          createdAt: "2026-10-21T10:00:00Z",
        },
        {
          id: "63000000-0000-4000-8000-000000000002",
          firstName: "Xián",
          birthYear: year - 14,
          declarationVersion: "2026-11",
          declaredAt: "2026-10-21T10:00:00Z",
          createdAt: "2026-10-21T10:00:00Z",
        },
      ],
    });
    const { spy } = stubJsonResponse({
      path: "*/v2/citizen/activity-enrolments",
      method: "POST",
      status: 201,
      response: {
        id: "62000000-0000-4000-8000-000000000003",
        activityId: swimming.id,
        activityName: swimming.name,
        activityStatus: "published",
        facilityId: facility.id,
        facilityName: facility.name,
        resourceName: "Rúa 2",
        status: "enrolled",
        participant: {
          dependantId: "63000000-0000-4000-8000-000000000001",
          firstName: "Uxía",
        },
        position: null,
        createdAt: "2026-10-21T10:00:00Z",
        enrolledAt: "2026-10-21T10:00:00Z",
        endedAt: null,
        nextSession: null,
        cancelledSessions: 0,
      } satisfies MyEnrolment,
    });
    await commands.navigate(`/app/vilaverde/actividades/${swimming.id}`);
    await render(<App />);
    const choice = page.getByRole("group", { name: "Para quen?" });
    await expect
      .element(choice.getByRole("radio", { name: "Uxía (9 anos)" }))
      .toBeChecked();
    await expect
      .element(
        choice.getByRole("radio", { name: "Xián: non ten a idade (14 anos)" }),
      )
      .toBeDisabled();
    await expect
      .element(choice.getByRole("radio", { name: "Para min" }))
      .not.toBeInTheDocument();
    await page.getByRole("button", { name: "Inscribirme" }).click();
    const dialog = page.getByRole("dialog");
    await expect.element(dialog.getByText("Participa: Uxía")).toBeVisible();
    await dialog.getByRole("button", { name: "Confirmar inscrición" }).click();
    await expect.poll(() => spy.mock.calls.length).toBe(1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          dependantId: "63000000-0000-4000-8000-000000000001",
        }),
      }),
    );
  });
});
