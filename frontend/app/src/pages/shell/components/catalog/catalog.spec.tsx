// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { page, commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { stubShell } from "@/test/fixtures";
describe("Facility catalog", () => {
  test("should offer only citizen access when a visitor opens the sign-in dialog", async () => {
    stubShell();
    await commands.navigate("/app/vilaverde/instalacions");
    await render(<App />);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect
      .element(page.getByRole("button", { name: "Entrar como cidadanía" }))
      .toBeDisabled();
    await page.getByText("Lin e acepto o aviso de privacidade").click();
    await expect
      .element(page.getByRole("button", { name: "Entrar como cidadanía" }))
      .toBeEnabled();
    await expect
      .element(page.getByRole("button", { name: "Entrar como xestor/a" }))
      .not.toBeInTheDocument();
    await expect
      .element(
        page.getByRole("link", { name: "Xestión municipal", exact: true }),
      )
      .not.toBeInTheDocument();
  });
  test("should filter facilities when a sport is selected", async () => {
    stubShell();
    await commands.navigate("/app/vilaverde/instalacions");
    await render(<App />);
    await expect
      .element(page.getByRole("heading", { name: "Pavillón municipal" }))
      .toBeVisible();
    await page.getByRole("button", { name: "Pádel", exact: true }).click();
    await expect
      .element(
        page.getByRole("heading", { name: "Pistas de pádel da Carballeira" }),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "Pavillón municipal" }))
      .not.toBeInTheDocument();
  });
  test("should show a retry action when the catalog cannot be loaded", async () => {
    stubShell();
    stubJsonResponse({
      path: "*/v2/public/facilities",
      response: { code: "unavailable" },
      status: 503,
    });
    await commands.navigate("/app/vilaverde/instalacions");
    await render(<App />);
    await expect
      .element(page.getByRole("alert"))
      .toMatchTextContent("Non puidemos cargar os datos.");
  });
  test("should display Spanish labels when the language is changed", async () => {
    stubShell();
    await commands.navigate("/app/vilaverde/instalacions");
    await render(<App />);
    await page.getByRole("button", { name: "ES", exact: true }).click();
    await expect
      .element(page.getByRole("heading", { name: "Instalaciones deportivas" }))
      .toBeVisible();
  });
});
