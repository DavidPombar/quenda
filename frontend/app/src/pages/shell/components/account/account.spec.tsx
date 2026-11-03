// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { page, commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { account, municipality, stubAccount, stubShell } from "@/test/fixtures";
const exported = {
  generatedAt: "2026-10-20T10:00:00Z",
  municipality: {
    slug: municipality.slug,
    name: municipality.name,
    contact: municipality.contact,
    legalVersion: municipality.legalVersion,
    retentionMonths: municipality.retentionMonths,
  },
  profile: {
    userId: account.userId,
    displayName: account.displayName,
    role: "citizen",
  },
  consents: account.consents,
  bookings: [],
  notifications: [],
  auditEvents: [],
};
describe("Account and privacy page", () => {
  test("should invite a visitor to sign in when they open the account page without a session", async () => {
    stubShell();
    await commands.navigate("/app/vilaverde/conta");
    await render(<App />);
    await expect
      .element(
        page.getByRole("heading", { name: "Entra para ver a túa conta" }),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "A miña conta" }))
      .not.toBeInTheDocument();
  });
  test("should show the person's data and the accepted notice version when they are signed in", async () => {
    stubShell(true);
    stubAccount();
    await commands.navigate("/app/vilaverde/conta");
    await render(<App />);
    await expect
      .element(page.getByRole("heading", { name: "Conta e privacidade" }))
      .toBeVisible();
    // The signed-in name shows in the top bar and in the data list; the list entry is the one under test.
    await expect
      .element(page.getByRole("heading", { name: "Os teus datos" }))
      .toBeVisible();
    await expect
      .element(page.getByText("Alex", { exact: true }).nth(1))
      .toBeVisible();
    await expect
      .element(page.getByText(municipality.legalVersion, { exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Descargar os meus datos" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "A miña conta" }))
      .toBeVisible();
  });
  test("should warn when the accepted notice version is no longer current", async () => {
    stubShell(true);
    stubAccount({ consentUpToDate: false });
    await commands.navigate("/app/vilaverde/conta");
    await render(<App />);
    await expect
      .element(page.getByRole("status"))
      .toMatchTextContent("Hai unha nova versión do aviso de privacidade.");
  });
  test("should confirm the download when the export is ready", async () => {
    stubShell(true);
    stubAccount();
    stubJsonResponse({ path: "*/v2/citizen/me/export", response: exported });
    await commands.navigate("/app/vilaverde/conta");
    await render(<App />);
    await page.getByRole("button", { name: "Descargar os meus datos" }).click();
    await expect
      .element(page.getByRole("status"))
      .toMatchTextContent("Descarga lista.");
  });
  test("should sign the person out and confirm when they delete their account", async () => {
    stubShell(true);
    stubAccount();
    stubJsonResponse({
      path: "*/v2/citizen/me",
      method: "DELETE",
      response: undefined,
      status: 204,
    });
    await commands.navigate("/app/vilaverde/conta");
    await render(<App />);
    await page.getByRole("button", { name: "Eliminar a conta" }).click();
    await expect.element(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Si, eliminar a conta" }).click();
    await expect
      .element(page.getByText("A túa conta foi eliminada.", { exact: false }))
      .toHaveAttribute("role", "status");
    await expect
      .element(page.getByRole("banner").getByRole("button", { name: "Entrar" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "A miña conta" }))
      .not.toBeInTheDocument();
  });
  test("should keep the dialog open with the reason when the deletion is refused", async () => {
    stubShell(true);
    stubAccount();
    stubJsonResponse({
      path: "*/v2/citizen/me",
      method: "DELETE",
      response: { code: "forbidden", detail: "Non tes permiso para isto." },
      status: 403,
    });
    await commands.navigate("/app/vilaverde/conta");
    await render(<App />);
    await page.getByRole("button", { name: "Eliminar a conta" }).click();
    await page.getByRole("button", { name: "Si, eliminar a conta" }).click();
    await expect
      .element(page.getByRole("alert"))
      .toMatchTextContent("Non tes permiso para isto.");
    await expect.element(page.getByRole("alertdialog")).toBeVisible();
  });
  test("should let the person request a category and see it pending verification", async () => {
    stubShell(true);
    stubAccount(
      {},
      {
        categories: [
          {
            category: "family",
            status: "verified",
            requestedAt: null,
            decidedAt: "2026-10-18T09:30:00Z",
          },
        ],
        prefersFamilyTariff: false,
      },
    );
    const { spy } = stubJsonResponse({
      path: "*/v2/citizen/categories",
      method: "POST",
      response: {
        category: "resident",
        status: "requested",
        requestedAt: "2026-10-20T10:00:00Z",
        decidedAt: null,
      },
      status: 201,
    });
    await commands.navigate("/app/vilaverde/conta");
    await render(<App />);
    const section = page.getByRole("region", { name: "Categorías e tarifas" });
    await expect.element(section.getByText("Verificada")).toBeVisible();
    await expect
      .element(
        section.getByRole("checkbox", {
          name: "Usar a tarifa familiar nas miñas reservas",
        }),
      )
      .toBeVisible();
    await section
      .getByRole("combobox", { name: "Categoría" })
      .selectOptions("Persoa empadroada");
    await section
      .getByRole("button", { name: "Solicitar a categoría" })
      .click();
    await expect
      .element(section.getByRole("status"))
      .toHaveTextContent("Solicitude enviada. O concello revisaraa.");
    expect(spy.mock.calls.at(-1)![0].body).toEqual({ category: "resident" });
  });
  test("should show the represented club and its upcoming season slots", async () => {
    stubShell(true);
    stubAccount();
    stubJsonResponse({
      path: "*/v2/citizen/me/club",
      response: {
        organization: {
          id: "club",
          name: "Club Pádel Vilaverde",
          sport: "padel",
        },
        occurrences: [
          {
            id: "slot",
            facilityName: "Pistas de pádel da Carballeira",
            resourceName: "Pista 1",
            start: "2026-11-03T18:00:00Z",
            end: "2026-11-03T20:00:00Z",
          },
        ],
      },
    });
    await commands.navigate("/app/vilaverde/conta");
    await render(<App />);
    await expect
      .element(
        page.getByRole("heading", { name: "O meu club: Club Pádel Vilaverde" }),
      )
      .toBeVisible();
    await expect.element(page.getByText(/19:00–21:00/)).toBeVisible();
    await expect
      .element(page.getByText("Pistas de pádel da Carballeira · Pista 1"))
      .toBeVisible();
  });
  test("should add a person in the adult's care only with the guardianship declaration, and remove them (#97)", async () => {
    stubShell(true);
    stubAccount();
    const uxia = {
      id: "63000000-0000-4000-8000-000000000001",
      firstName: "Uxía",
      birthYear: 2017,
      declarationVersion: "2026-11",
      declaredAt: "2026-10-21T10:00:00Z",
      createdAt: "2026-10-21T10:00:00Z",
    };
    const added = stubJsonResponse({
      path: "*/v2/citizen/dependants",
      method: "POST",
      status: 201,
      response: uxia,
    });
    await commands.navigate("/app/vilaverde/conta");
    await render(<App />);
    const block = page.getByRole("region", { name: "Persoas ao meu cargo" });
    await expect
      .element(block.getByText("Aínda non engadiches ningunha persoa."))
      .toBeVisible();
    await block
      .getByRole("button", { name: "Engadir unha persoa ao teu cargo" })
      .click();
    const form = block.getByRole("form", {
      name: "Engadir unha persoa ao teu cargo",
    });
    await form.getByRole("textbox", { name: "Nome" }).fill("Uxía");
    await form
      .getByRole("spinbutton", { name: "Ano de nacemento" })
      .fill("2017");
    await form.getByRole("button", { name: "Gardar" }).click();
    // Without the declaration nothing is sent.
    await expect
      .element(
        form.getByRole("alert").filter({ hasText: "marca a declaración" }),
      )
      .toBeVisible();
    expect(added.spy).not.toHaveBeenCalled();
    stubJsonResponse({ path: "*/v2/citizen/dependants", response: [uxia] });
    await form.getByText(/Declaro que teño a patria potestade/).click();
    await form.getByRole("button", { name: "Gardar" }).click();
    await expect.poll(() => added.spy.mock.calls.length).toBe(1);
    expect(added.spy).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          firstName: "Uxía",
          birthYear: 2017,
          declared: true,
          declarationVersion: "2026-11",
        }),
      }),
    );
    await expect
      .element(block.getByText("Uxía", { exact: true }))
      .toBeVisible();
    const removal = stubJsonResponse({
      path: `*/v2/citizen/dependants/${uxia.id}`,
      method: "DELETE",
      status: 204,
      response: null,
    });
    await block.getByRole("button", { name: "Eliminar: Uxía" }).click();
    const dialog = page.getByRole("alertdialog");
    await dialog.getByRole("button", { name: "Eliminar" }).click();
    await expect.poll(() => removal.spy.mock.calls.length).toBe(1);
  });
});
