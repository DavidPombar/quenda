// SPDX-License-Identifier: AGPL-3.0-or-later
import { test, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { App } from "@/components/app/app.view";

test("should show the public website when a visitor opens the home page", async () => {
  await commands.navigate("/");
  await render(<App />);
  await expect
    .element(
      page.getByRole("heading", {
        name: "Reserva as pistas e piscinas do teu concello.",
      }),
    )
    .toBeVisible();
  await expect
    .element(
      page.getByRole("link", { name: "Abrir a aplicación", exact: true }),
    )
    .toHaveAttribute("href", "/app/");
  await expect
    .element(
      page.getByRole("link", {
        name: "Explorar a demo municipal",
        exact: true,
      }),
    )
    .toHaveAttribute("href", "/admin/");
});

test("should show Spanish content when a visitor changes the language", async () => {
  await commands.navigate("/");
  await render(<App />);
  await page.getByRole("button", { name: "ES", exact: true }).click();
  await expect
    .element(
      page.getByRole("heading", {
        name: "Reserva las pistas y piscinas de tu ayuntamiento.",
      }),
    )
    .toBeVisible();
  await expect
    .element(
      page.getByRole("link", { name: "Abrir la aplicación", exact: true }),
    )
    .toHaveAttribute("href", "/app/");
});
