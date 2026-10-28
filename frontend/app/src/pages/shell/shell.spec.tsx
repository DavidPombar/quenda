// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, test, vi } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { navigationService } from "@/services/navigation.service";
import { municipality, stubShell } from "@/test/fixtures";
async function openSignIn() {
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}
describe("Citizen sign-in", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  test("should not offer eID sign-in when it is not configured", async () => {
    stubShell(false, { demo: true, oidc: null });
    await commands.navigate("/app/vilaverde/instalacions");
    await render(<App />);
    await openSignIn();
    await expect
      .element(page.getByRole("button", { name: "Entrar como cidadanía" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: /^Entrar con / }))
      .not.toBeInTheDocument();
  });
  test("should enable eID sign-in only after the privacy notice is accepted", async () => {
    stubShell(false, { demo: true, oidc: { label: "Cl@ve" } });
    await commands.navigate("/app/vilaverde/instalacions");
    await render(<App />);
    await openSignIn();
    await expect
      .element(page.getByRole("button", { name: "Entrar con Cl@ve" }))
      .toBeDisabled();
    await page.getByText("Lin e acepto o aviso de privacidade").click();
    await expect
      .element(page.getByRole("button", { name: "Entrar con Cl@ve" }))
      .toBeEnabled();
  });
  test("should navigate to the eID start address when eID sign-in is chosen", async () => {
    const assign = vi
      .spyOn(navigationService, "assign")
      .mockImplementation(() => undefined);
    stubShell(false, { demo: false, oidc: { label: "Cl@ve" } });
    await commands.navigate("/app/vilaverde/instalacions");
    await render(<App />);
    await openSignIn();
    await page.getByText("Lin e acepto o aviso de privacidade").click();
    await page.getByRole("button", { name: "Entrar con Cl@ve" }).click();
    expect(assign).toHaveBeenCalledTimes(1);
    const target = new URL(assign.mock.calls[0][0], window.location.origin);
    expect(target.pathname).toBe("/v2/public/auth/oidc/start");
    expect(Object.fromEntries(target.searchParams)).toEqual({
      slug: "vilaverde",
      legalVersion: municipality.legalVersion,
      returnTo: "/app/vilaverde/instalacions",
    });
  });
  test("should hide demo sign-in when the demo is disabled", async () => {
    stubShell(false, { demo: false, oidc: { label: "Cl@ve" } });
    await commands.navigate("/app/vilaverde/instalacions");
    await render(<App />);
    await openSignIn();
    await expect
      .element(page.getByRole("button", { name: "Entrar con Cl@ve" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Entrar como cidadanía" }))
      .not.toBeInTheDocument();
  });
  test("should explain that sign-in is unavailable when no method is enabled", async () => {
    stubShell(false, { demo: false, oidc: null });
    await commands.navigate("/app/vilaverde/instalacions");
    await render(<App />);
    await openSignIn();
    await expect
      .element(
        page.getByText(
          "Agora mesmo non hai ningunha forma de entrar dispoñible.",
          { exact: false },
        ),
      )
      .toBeVisible();
  });
  test("should report an expired eID login and clear it from the address", async () => {
    stubShell(false, { demo: true, oidc: { label: "Cl@ve" } });
    await commands.navigate(
      "/app/vilaverde/instalacions?authError=login_expired",
    );
    await render(<App />);
    await expect
      .element(page.getByRole("alert"))
      .toMatchTextContent(
        "A identificación tardou demasiado e caducou. Volve tentalo.",
      );
    await expect.poll(() => window.location.search).toBe("");
    expect(window.location.pathname).toBe("/app/vilaverde/instalacions");
    await page.getByRole("button", { name: "Tentar de novo" }).click();
    await expect
      .element(page.getByRole("button", { name: "Entrar con Cl@ve" }))
      .toBeDisabled();
  });
  test("should report an unknown eID failure with a generic message", async () => {
    stubShell();
    await commands.navigate("/app/vilaverde/instalacions?authError=whatever");
    await render(<App />);
    await expect
      .element(page.getByRole("alert"))
      .toMatchTextContent("Non puidemos completar a entrada. Volve tentalo.");
  });
});
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
