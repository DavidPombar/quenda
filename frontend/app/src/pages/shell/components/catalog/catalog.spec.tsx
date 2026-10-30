// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { page, commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { facility, stubFacilities, stubShell } from "@/test/fixtures";
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
  test("should page through the catalogue on the server and keep the filters in the address", async () => {
    stubShell();
    const many = Array.from({ length: 30 }, (_, index) => ({
      ...facility,
      id: `facility-${index + 1}`,
      name: `Instalación ${String(index + 1).padStart(2, "0")}`,
    }));
    const { spy } = stubFacilities(many);
    await commands.navigate("/app/vilaverde/instalacions");
    await render(<App />);
    await expect
      .element(page.getByRole("status"))
      .toHaveTextContent("30 resultados");
    const pages = page.getByRole("navigation", {
      name: "Páxinas de resultados",
    });
    await expect
      .element(pages.getByRole("link", { name: "Páxina 1 de 3" }))
      .toHaveAttribute("aria-current", "page");
    await pages.getByRole("link", { name: "Páxina 2 de 3" }).click();
    await expect
      .element(page.getByRole("heading", { name: "Instalación 13" }))
      .toBeVisible();
    expect(window.location.search).toBe("?paxina=2");
    expect(new URL(spy.mock.lastCall![0].url).searchParams.get("page")).toBe(
      "2",
    );
    await page.getByRole("checkbox", { name: "Ocultar as pechadas" }).click();
    await expect
      .element(page.getByRole("heading", { name: "Instalación 01" }))
      .toBeVisible();
    const params = new URL(spy.mock.lastCall![0].url).searchParams;
    expect(params.get("hideClosed")).toBe("true");
    expect(params.get("page")).toBe("1");
    expect(window.location.search).toBe("?ocultarPechadas=1");
  });
});
