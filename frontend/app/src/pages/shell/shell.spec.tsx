// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { page, commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { municipality, stubShell } from "@/test/fixtures";
function stubMunicipality(overrides: Partial<typeof municipality>) {
  stubJsonResponse({
    path: "*/v2/public/municipalities",
    response: [{ ...municipality, ...overrides }],
  });
}
describe("Municipal settings in the citizen app", () => {
  test("should open in the municipality's default language and show the notice in it", async () => {
    stubShell();
    stubMunicipality({ locale: "es" });
    await commands.navigate("/app/vilaverde/instalacions");
    await render(<App />);
    await expect
      .element(page.getByRole("heading", { name: "Instalaciones deportivas" }))
      .toBeVisible();
    expect(document.documentElement.lang).toBe("es");
    await page.getByRole("button", { name: "Privacidad", exact: true }).click();
    await expect
      .element(
        page
          .getByRole("dialog")
          .getByText("Demostración con datos ficticios en castellano."),
      )
      .toBeVisible();
    expect(localStorage.getItem("quenda.locale")).toBe(null);
  });
  test("should keep the person's own language choice over the municipality default", async () => {
    localStorage.setItem("quenda.locale", "gl");
    stubShell();
    stubMunicipality({ locale: "es" });
    await commands.navigate("/app/vilaverde/instalacions");
    await render(<App />);
    await expect
      .element(page.getByRole("heading", { name: "Instalacións deportivas" }))
      .toBeVisible();
  });
  test("should apply the municipal colour and logo", async () => {
    stubShell();
    stubMunicipality({
      primaryColor: "#1a4d8f",
      logoUrl: "/v2/public/municipalities/vilaverde/logo?v=abc",
    });
    stubJsonResponse({
      path: "*/v2/public/municipalities/vilaverde/logo",
      response: "",
    });
    await commands.navigate("/app/vilaverde/instalacions");
    await render(<App />);
    await expect
      .element(
        page.getByRole("img", {
          name: "Logotipo do concello: Concello de Vilaverde",
        }),
      )
      .toBeInTheDocument();
    expect(document.documentElement.style.getPropertyValue("--court")).toBe(
      "#1a4d8f",
    );
  });
});
