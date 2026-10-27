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
      .element(page.getByRole("status"))
      .toMatchTextContent("A túa conta foi eliminada.");
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
  test("should save the reminder preference when the person unticks email reminders", async () => {
    stubShell(true);
    stubAccount();
    const { spy } = stubJsonResponse({
      path: "*/v2/citizen/me/notification-preferences",
      method: "PUT",
      response: {},
    });
    await commands.navigate("/app/vilaverde/conta");
    await render(<App />);
    await expect
      .element(page.getByText(account.email ?? "", { exact: true }))
      .toBeVisible();
    const reminders = page.getByRole("checkbox", {
      name: "Recibir unha lembranza por correo antes de cada reserva",
    });
    await expect.element(reminders).toBeChecked();
    await expect
      .element(page.getByText("Chega 24 horas antes do inicio."))
      .toBeVisible();
    await page
      .getByText("Recibir unha lembranza por correo antes de cada reserva")
      .click();
    await expect
      .element(page.getByRole("status"))
      .toMatchTextContent("Preferencia gardada.");
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ body: { reminderEmails: false } }),
    );
  });
  test("should explain that notices stay in the app when the account has no email", async () => {
    stubShell(true);
    stubAccount({ email: null });
    await commands.navigate("/app/vilaverde/conta");
    await render(<App />);
    await expect
      .element(
        page.getByText(
          "Esta conta non ten correo, así que só verás os avisos aquí.",
        ),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("checkbox", { name: /lembranza/ }))
      .not.toBeInTheDocument();
  });
});
