// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { stubShell, municipality } from "@/test/fixtures";
import type {
  MunicipalitySettings,
  SettingsPatch,
  SettingsUpdate,
} from "@/types/models";

const settings: MunicipalitySettings = {
  ...municipality,
  holidaysCalendar: "",
};

function stubManager(overrides: Partial<MunicipalitySettings> = {}) {
  stubShell();
  stubJsonResponse({
    path: "*/v2/public/municipalities",
    response: [{ ...municipality, ...overrides }],
  });
  stubJsonResponse({
    path: "*/v2/public/session",
    response: {
      session: {
        userId: "manager",
        tenantId: municipality.id,
        displayName: "Uxía",
        role: "manager",
      },
    },
  });
  stubJsonResponse({
    path: "*/v2/manager/municipality",
    response: { ...settings, ...overrides },
  });
}

function stubPatch(result: Partial<MunicipalitySettings> = {}, affected = 0) {
  return stubJsonResponse({
    path: "*/v2/manager/municipality",
    method: "PATCH",
    response: ({ body }: { body: unknown }): SettingsUpdate => ({
      settings: { ...settings, ...(body as SettingsPatch), ...result },
      affectedBookings: affected,
    }),
  });
}

async function open() {
  await commands.navigate("/admin/vilaverde/axustes");
  await render(<App />);
  await expect
    .element(page.getByRole("heading", { level: 1, name: "Axustes" }))
    .toBeVisible();
}

describe("municipal settings", () => {
  test("should send the new cancellation deadline when a manager saves the booking rules", async () => {
    stubManager();
    const { spy } = stubPatch();
    await open();
    const rules = page.getByRole("region", { name: "Regras de reserva" });
    await rules
      .getByRole("spinbutton", {
        name: "Prazo para cambiar ou cancelar (horas antes)",
      })
      .fill("48");
    await rules.getByRole("button", { name: "Gardar cambios" }).click();
    await expect
      .element(rules.getByRole("status"))
      .toHaveTextContent("Cambios gardados.");
    expect(spy.mock.calls.at(-1)![0].body).toEqual({
      advanceDays: 14,
      cancellationHours: 48,
      maxActiveBookings: 5,
    });
  });

  test("should explain an out-of-range rule without calling the API", async () => {
    stubManager();
    const { spy } = stubPatch();
    await open();
    const rules = page.getByRole("region", { name: "Regras de reserva" });
    await rules
      .getByRole("spinbutton", { name: "Antelación máxima (días)" })
      .fill("120");
    await rules.getByRole("button", { name: "Gardar cambios" }).click();
    await expect
      .element(rules.getByText("Indica entre 1 e 90 días."))
      .toBeVisible();
    expect(spy).not.toHaveBeenCalled();
  });

  test("should publish a new privacy notice version in both languages", async () => {
    stubManager();
    const { spy } = stubPatch({ legalVersion: "2026-10-27.1" });
    await open();
    const legal = page.getByRole("region", { name: "Aviso de privacidade" });
    await legal
      .getByRole("textbox", { name: "Texto en galego" })
      .fill("Novo aviso de privacidade do concello.");
    await legal
      .getByRole("textbox", { name: "Texto en castelán" })
      .fill("Nuevo aviso de privacidad del ayuntamiento.");
    await legal.getByRole("button", { name: "Publicar nova versión" }).click();
    await expect
      .element(legal.getByRole("status"))
      .toHaveTextContent("Publicada a versión 2026-10-27.1");
    expect(spy.mock.calls.at(-1)![0].body).toEqual({
      legalTexts: {
        gl: "Novo aviso de privacidade do concello.",
        es: "Nuevo aviso de privacidad del ayuntamiento.",
      },
    });
  });

  test("should reject a primary colour below AA contrast before saving", async () => {
    stubManager();
    const { spy } = stubPatch();
    await open();
    const branding = page.getByRole("region", { name: "Imaxe do concello" });
    const color = branding.getByRole("textbox", { name: "Cor principal" });
    await color.fill("#ffd700");
    await branding.getByRole("button", { name: "Gardar cambios" }).click();
    await expect
      .element(branding.getByText(/non chega ao contraste mínimo/))
      .toBeVisible();
    expect(spy).not.toHaveBeenCalled();
    await color.fill("#1a4d8f");
    await branding.getByRole("button", { name: "Gardar cambios" }).click();
    await expect
      .element(branding.getByRole("status"))
      .toHaveTextContent("Cambios gardados.");
    expect(spy.mock.calls.at(-1)![0].body).toEqual({
      primaryColor: "#1a4d8f",
    });
  });

  test("should save a yearly holiday as an all-day iCalendar event and report kept bookings", async () => {
    stubManager();
    const { spy } = stubPatch({}, 2);
    await open();
    const holidays = page.getByRole("region", { name: "Festivos municipais" });
    await holidays.getByLabelText("Data", { exact: true }).fill("2026-12-25");
    await holidays
      .getByRole("textbox", { name: "Nome", exact: true })
      .fill("Nadal");
    await holidays.getByRole("button", { name: "Engadir festivo" }).click();
    await expect
      .element(holidays.getByRole("listitem").getByText("Nadal"))
      .toBeVisible();
    await holidays.getByRole("button", { name: "Gardar festivos" }).click();
    await expect
      .element(holidays.getByText(/caen nun festivo novo \(mantéñense\): 2/))
      .toBeVisible();
    const calendar = (spy.mock.calls.at(-1)![0].body as SettingsPatch)
      .holidaysCalendar;
    expect(calendar).toContain("DTSTART;VALUE=DATE:20261225");
    expect(calendar).toContain("RRULE:FREQ=YEARLY");
    expect(calendar).toContain("SUMMARY:Nadal");
  });

  test("should use the municipality's default language until the person picks one", async () => {
    stubManager({ locale: "es" });
    await commands.navigate("/admin/vilaverde/axustes");
    await render(<App />);
    await expect
      .element(page.getByRole("heading", { level: 1, name: "Ajustes" }))
      .toBeVisible();
    await page.getByRole("button", { name: "GL", exact: true }).click();
    await expect
      .element(page.getByRole("heading", { level: 1, name: "Axustes" }))
      .toBeVisible();
    expect(localStorage.getItem("quenda.locale")).toBe("gl");
  });
});
