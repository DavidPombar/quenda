// SPDX-License-Identifier: AGPL-3.0-or-later
import { test, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { App } from "@/components/app/app.view";

test("should link the accessibility statement from the website footer", async () => {
  await commands.navigate("/");
  await render(<App />);
  await expect
    .element(
      page.getByRole("link", {
        name: "Declaración de accesibilidade",
        exact: true,
      }),
    )
    .toHaveAttribute("href", "/accesibilidade");
});

test("should show the platform statement and point to each municipality's own statement", async () => {
  await commands.navigate("/accesibilidade");
  await render(<App />);
  await expect
    .element(
      page.getByRole("heading", {
        level: 1,
        name: "Declaración de accesibilidade",
      }),
    )
    .toBeVisible();
  await expect.element(page.getByText(/parcialmente conforme/)).toBeVisible();
  await expect
    .element(
      page.getByRole("link", { name: "Ir á aplicación do teu concello" }),
    )
    .toHaveAttribute("href", "/app/");
  await page.getByRole("button", { name: "ES", exact: true }).click();
  await expect
    .element(
      page.getByRole("heading", {
        level: 1,
        name: "Declaración de accesibilidad",
      }),
    )
    .toBeVisible();
});
