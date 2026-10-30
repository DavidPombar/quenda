// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { page, commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { stubShell } from "@/test/fixtures";
describe("Unsubscribe from one kind of email notice", () => {
  test("should switch the notice off only after the person confirms, and name it", async () => {
    stubShell();
    const { spy } = stubJsonResponse({
      path: "*/v2/public/unsubscribe",
      method: "POST",
      response: { kind: "reminder" },
    });
    await commands.navigate("/app/vilaverde/baixa?token=signed-token");
    await render(<App />);
    await expect
      .element(
        page.getByRole("heading", {
          name: "Baixa dun aviso por correo",
        }),
      )
      .toBeVisible();
    expect(spy).not.toHaveBeenCalled();
    await page.getByRole("button", { name: "Confirmar a baixa" }).click();
    await expect
      .element(page.getByRole("status"))
      .toMatchTextContent(
        "Feito. Xa non che enviaremos por correo: lembranza antes da reserva. Seguirás véndoo no historial da app.",
      );
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ body: { token: "signed-token" } }),
    );
  });
  test("should point to the account page when the link is not valid", async () => {
    stubShell();
    stubJsonResponse({
      path: "*/v2/public/unsubscribe",
      method: "POST",
      status: 400,
      response: { code: "validation", detail: "" },
    });
    await commands.navigate("/app/vilaverde/baixa?token=broken");
    await render(<App />);
    await page.getByRole("button", { name: "Confirmar a baixa" }).click();
    await expect
      .element(page.getByRole("alert"))
      .toMatchTextContent(/A ligazón non é válida/);
    await expect
      .element(page.getByRole("link", { name: "Ir á miña conta" }))
      .toHaveAttribute("href", "/app/vilaverde/conta");
  });
  test("should explain that a link stops working once the person changes that notice", async () => {
    stubShell();
    stubJsonResponse({
      path: "*/v2/public/unsubscribe",
      method: "POST",
      status: 410,
      response: { code: "unsubscribe_stale", detail: "" },
    });
    await commands.navigate("/app/vilaverde/baixa?token=old");
    await render(<App />);
    await page.getByRole("button", { name: "Confirmar a baixa" }).click();
    await expect
      .element(page.getByRole("alert"))
      .toMatchTextContent(/cambiaches os avisos despois de recibila/);
  });
});
