// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, test } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { municipality, stubShell } from "@/test/fixtures";
describe("Page names, skip link and the municipality selector (T5)", () => {
  test("should name the page in the title and change municipality only when confirmed", async () => {
    stubShell();
    stubJsonResponse({
      path: "*/v2/public/municipalities",
      response: [
        municipality,
        {
          ...municipality,
          id: "00000000-0000-4000-8000-000000000099",
          slug: "portomar",
          name: "Concello de Portomar",
        },
      ],
    });
    await commands.navigate("/admin/vilaverde/xestion");
    await render(<App />);
    await expect
      .element(
        page.getByRole("heading", {
          name: "Este espazo é para o persoal municipal.",
        }),
      )
      .toBeVisible();
    await expect
      .poll(() => document.title)
      .toBe("Concello de Vilaverde · Quenda");
    await page
      .getByRole("combobox", { name: "Concello" })
      .selectOptions("portomar");
    expect(window.location.pathname).toBe("/admin/vilaverde/xestion");
    await page.getByRole("button", { name: "Cambiar", exact: true }).click();
    await expect
      .poll(() => window.location.pathname)
      .toBe("/admin/portomar/xestion");
  });
  test("should offer a skip link on the backoffice home", async () => {
    stubShell();
    await commands.navigate("/admin/");
    await render(<App />);
    await expect
      .element(page.getByRole("link", { name: "Saltar ao contido" }))
      .toHaveAttribute("href", "#main");
  });
});
