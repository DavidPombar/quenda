// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, test, vi } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
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
