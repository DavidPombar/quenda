// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { municipality, stubAuthMethods, stubShell } from "@/test/fixtures";
import type { StaffAccount } from "@/types/models";
const manager = {
  userId: "manager",
  tenantId: municipality.id,
  displayName: "Uxía Pereira",
  role: "manager",
  assurance: "local",
};
function stubManager() {
  stubShell();
  stubJsonResponse({
    path: "*/v2/public/session",
    response: { session: manager },
  });
}
const door: StaffAccount = {
  userId: "door-1",
  displayName: "Brais Porta",
  role: "access",
  login: "brais.porta",
  enrolled: true,
  disabled: false,
};
describe("Staff accounts (#8)", () => {
  test("should take a manager from the temporary password to a session with the authenticator app", async () => {
    stubShell();
    stubAuthMethods({ demo: false, local: true });
    const password = stubJsonResponse({
      path: "*/v2/public/auth/staff/password",
      method: "POST",
      status: 401,
      response: { code: "login_rejected", detail: "" },
    });
    await commands.navigate("/admin/vilaverde/persoal");
    await render(<App />);
    await page
      .getByRole("banner")
      .getByRole("button", { name: "Entrar" })
      .click();
    const dialog = page.getByRole("dialog");
    await expect
      .element(dialog.getByRole("button", { name: "Entrar como xestor/a" }))
      .not.toBeInTheDocument();
    await dialog.getByRole("textbox", { name: "Usuario" }).fill("uxia.xestion");
    await dialog.getByLabelText("Contrasinal").fill("wrong password");
    await dialog.getByRole("button", { name: "Continuar" }).click();
    await expect
      .element(dialog.getByRole("alert"))
      .toHaveTextContent("O usuario ou o contrasinal non son correctos.");
    expect(password.spy.mock.calls[0][0].body).toEqual({
      slug: "vilaverde",
      login: "uxia.xestion",
      password: "wrong password",
    });
    stubJsonResponse({
      path: "*/v2/public/auth/staff/password",
      method: "POST",
      response: { ticket: "t1", step: "password_change" },
    });
    const change = stubJsonResponse({
      path: "*/v2/public/auth/local/password-change",
      method: "POST",
      response: {
        ticket: "t2",
        step: "enroll",
        enrollment: {
          secret: "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP",
          otpauthUri: "otpauth://totp/Quenda%3Auxia?secret=JBSWY3DPEHPK3PXP",
        },
      },
    });
    const totp = stubJsonResponse({
      path: "*/v2/public/auth/local/totp",
      method: "POST",
      response: manager,
    });
    stubJsonResponse({ path: "*/v2/manager/staff", response: [door] });
    await dialog.getByLabelText("Contrasinal").fill("TemporaryPass1");
    await dialog.getByRole("button", { name: "Continuar" }).click();
    await dialog
      .getByRole("form", { name: "Novo contrasinal" })
      .getByLabelText("Novo contrasinal")
      .fill("a long new password");
    await dialog
      .getByLabelText("Repite o contrasinal")
      .fill("a long new password!");
    await dialog.getByRole("button", { name: "Continuar" }).click();
    await expect
      .element(dialog.getByRole("alert"))
      .toHaveTextContent("Os dous contrasinais non coinciden.");
    expect(change.spy).not.toHaveBeenCalled();
    await dialog
      .getByLabelText("Repite o contrasinal")
      .fill("a long new password");
    await dialog.getByRole("button", { name: "Continuar" }).click();
    await expect
      .element(
        dialog.getByRole("img", {
          name: "Código QR para a app de autenticación",
        }),
      )
      .toBeVisible();
    await expect
      .element(dialog.getByText("JBSW Y3DP EHPK 3PXP JBSW Y3DP EHPK 3PXP"))
      .toBeVisible();
    await dialog
      .getByRole("textbox", { name: "Código de 6 cifras" })
      .fill("123456");
    await dialog.getByRole("button", { name: "Entrar" }).click();
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    expect(change.spy.mock.calls[0][0].body).toEqual({
      ticket: "t1",
      newPassword: "a long new password",
    });
    expect(totp.spy.mock.calls[0][0].body).toEqual({
      ticket: "t2",
      code: "123456",
    });
    await expect
      .element(
        page.getByRole("heading", { level: 2, name: "Control de accesos" }),
      )
      .toBeVisible();
  });
  test("should open a door staff account and show its temporary password once", async () => {
    stubManager();
    stubJsonResponse({ path: "*/v2/manager/staff", response: [door] });
    const created = stubJsonResponse({
      path: "*/v2/manager/staff",
      method: "POST",
      status: 201,
      response: { login: "iago.porta", temporaryPassword: "bAZft6SSTSm_Mh8A" },
    });
    await commands.navigate("/admin/vilaverde/persoal");
    await render(<App />);
    await expect
      .element(page.getByRole("rowheader", { name: "Brais Porta" }))
      .toBeVisible();
    const form = page.getByRole("form", {
      name: "Crear conta de control de accesos",
    });
    await form.getByRole("textbox", { name: "Nome" }).fill("Iago Porta");
    await form.getByRole("textbox", { name: "Usuario" }).fill("iago porta");
    await form
      .getByRole("button", { name: "Crear conta de control de accesos" })
      .click();
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent(
        "Escribe un usuario de 3 a 64 letras, números, puntos ou guións.",
      );
    expect(created.spy).not.toHaveBeenCalled();
    await form.getByRole("textbox", { name: "Usuario" }).fill("iago.porta");
    await form
      .getByRole("button", { name: "Crear conta de control de accesos" })
      .click();
    const shown = page.getByRole("alertdialog", {
      name: "Contrasinal temporal",
    });
    await expect.element(shown.getByText("bAZft6SSTSm_Mh8A")).toBeVisible();
    expect(created.spy.mock.calls[0][0].body).toMatchObject({
      displayName: "Iago Porta",
      login: "iago.porta",
    });
    await shown.getByRole("button", { name: "Feito" }).click();
    await expect.element(shown).not.toBeInTheDocument();
  });
  test("should disable a door staff account and say so", async () => {
    stubManager();
    stubJsonResponse({ path: "*/v2/manager/staff", response: [door] });
    const updated = stubJsonResponse({
      path: "*/v2/manager/staff/:userId",
      method: "PATCH",
      response: { login: "brais.porta", temporaryPassword: null },
    });
    await commands.navigate("/admin/vilaverde/persoal");
    await render(<App />);
    await page.getByRole("button", { name: "Desactivar: Brais Porta" }).click();
    await expect
      .element(page.getByRole("status").filter({ hasText: "Brais Porta" }))
      .toHaveTextContent("Conta desactivada: Brais Porta");
    expect(updated.spy.mock.calls[0][0]).toMatchObject({
      url: expect.stringContaining("/manager/staff/door-1"),
      body: { action: "disable" },
    });
  });
});
