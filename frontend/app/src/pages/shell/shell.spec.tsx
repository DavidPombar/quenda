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
  test("should sign in with a mailed code in two steps without saying whether the account exists", async () => {
    stubShell(false, { demo: false, oidc: null, email: true });
    const requested = stubJsonResponse({
      path: "*/v2/public/auth/email/codes",
      method: "POST",
      status: 202,
      response: undefined,
    });
    const verified = stubJsonResponse({
      path: "*/v2/public/auth/email/sessions",
      method: "POST",
      status: 400,
      response: { code: "code_invalid", detail: "" },
    });
    await commands.navigate("/app/vilaverde/instalacions");
    await render(<App />);
    await openSignIn();
    const send = page.getByRole("button", { name: "Enviar código" });
    await expect.element(send).toBeDisabled();
    await page.getByText("Lin e acepto o aviso de privacidade").click();
    await page
      .getByRole("textbox", { name: "Correo electrónico" })
      .fill("ana@example.org");
    await send.click();
    await expect
      .element(page.getByRole("status").filter({ hasText: "ana@example.org" }))
      .toHaveTextContent(
        "Se ana@example.org pode entrar, acaba de recibir un código. Mira tamén no correo non desexado.",
      );
    expect(requested.spy.mock.calls[0][0].body).toEqual({
      slug: "vilaverde",
      email: "ana@example.org",
      legalVersion: municipality.legalVersion,
      locale: "gl",
    });
    const code = page.getByRole("textbox", { name: "Código de 6 cifras" });
    await code.fill("12a");
    await page
      .getByRole("button", { name: "Entrar", exact: true })
      .last()
      .click();
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("O código ten 6 cifras.");
    await code.fill("123456");
    await page
      .getByRole("button", { name: "Entrar", exact: true })
      .last()
      .click();
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("O código non é correcto. Revísao ou pide outro.");
    stubJsonResponse({
      path: "*/v2/public/auth/email/sessions",
      method: "POST",
      status: 201,
      response: {
        userId: "u1",
        tenantId: municipality.id,
        displayName: "ana",
        role: "citizen",
        assurance: "email",
      },
    });
    stubJsonResponse({
      path: "*/v2/citizen/me",
      method: "PATCH",
      response: {},
    });
    await page
      .getByRole("button", { name: "Entrar", exact: true })
      .last()
      .click();
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    expect(verified.spy.mock.calls[0][0].body).toEqual({
      slug: "vilaverde",
      email: "ana@example.org",
      code: "123456",
    });
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
    const logo = stubJsonResponse({
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
    // Wait for the image request, so it does not reach the next test's handlers.
    await expect.poll(() => logo.spy.mock.calls.length).toBeGreaterThan(0);
  });
});
describe("Web analytics", () => {
  test("should count each page shown through the API when the council has analytics on", async () => {
    stubShell();
    stubJsonResponse({
      path: "*/v2/public/municipalities",
      response: [{ ...municipality, analytics: true }],
    });
    const { spy } = stubJsonResponse({
      path: "*/v2/public/analytics/pageview",
      method: "POST",
      status: 204,
    });
    await commands.navigate("/app/vilaverde/accesibilidade");
    await render(<App />);
    await expect.poll(() => spy.mock.calls.length).toBe(1);
    expect(spy.mock.calls[0][0].body).toEqual({
      app: "app",
      slug: "vilaverde",
      path: "/app/vilaverde/accesibilidade",
      language: "gl",
      screen: expect.stringMatching(/^\d+x\d+$/) as string,
    });
    await page.getByRole("link", { name: "Datos abertos" }).first().click();
    await expect.poll(() => spy.mock.calls.length).toBe(2);
    expect(spy.mock.calls[1][0].body).toMatchObject({
      path: "/app/vilaverde/datos-abertos",
    });
  });
  test("should send nothing when the browser asks not to be tracked", async () => {
    vi.spyOn(navigator, "doNotTrack", "get").mockReturnValue("1");
    stubShell();
    stubJsonResponse({
      path: "*/v2/public/municipalities",
      response: [{ ...municipality, analytics: true }],
    });
    const { spy } = stubJsonResponse({
      path: "*/v2/public/analytics/pageview",
      method: "POST",
      status: 204,
    });
    await commands.navigate("/app/vilaverde/accesibilidade");
    await render(<App />);
    await expect.element(page.getByRole("heading", { level: 1 })).toBeVisible();
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(spy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
describe("Installable app (#24)", () => {
  test("should install with the council's own manifest, name, colour and icon", async () => {
    stubShell(false);
    stubJsonResponse({
      path: "*/v2/public/municipalities",
      response: [
        {
          ...municipality,
          primaryColor: "#7a1f3d",
          iconUrl: "/v2/public/municipalities/vilaverde/icon?v=abc",
        },
      ],
    });
    await commands.navigate("/app/vilaverde/instalacions");
    await render(<App />);
    const head = (selector: string, attribute: string) =>
      document.head.querySelector(selector)?.getAttribute(attribute);
    await expect
      .poll(() => head('link[rel="apple-touch-icon"]', "href"))
      .toBe("/v2/public/municipalities/vilaverde/icon?v=abc");
    expect(head('link[rel="manifest"]', "href")).toBe(
      "/v2/public/municipalities/vilaverde/manifest",
    );
    expect(head('meta[name="apple-mobile-web-app-title"]', "content")).toBe(
      municipality.name,
    );
    expect(head('meta[name="theme-color"]', "content")).toBe("#7a1f3d");
  });
});
