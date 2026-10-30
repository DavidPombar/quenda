// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { stubShell, municipality } from "@/test/fixtures";
import type {
  MunicipalitySettings,
  SettingsPatch,
  SettingsUpdate,
} from "@/types/models";

const settings: MunicipalitySettings = {
  ...municipality,
  holidaysCalendar: "",
  analyticsEnabled: false,
  analyticsAvailable: true,
};

function stubManager(overrides: Partial<MunicipalitySettings> = {}) {
  stubShell();
  stubJsonResponse({
    path: "*/v2/public/municipalities",
    response: [{ ...municipality, ...overrides }],
  });
  stubJsonResponse({
    path: "*/v2/public/session",
    response: {
      session: {
        userId: "manager",
        tenantId: municipality.id,
        displayName: "Uxía",
        role: "manager",
      },
    },
  });
  stubJsonResponse({
    path: "*/v2/manager/municipality",
    response: { ...settings, ...overrides },
  });
  stubJsonResponse({
    path: "*/v2/manager/access-settings",
    response: { webhookUrl: "", hasWebhookSecret: false, keys: [] },
  });
}

function stubPatch(result: Partial<MunicipalitySettings> = {}, affected = 0) {
  return stubJsonResponse({
    path: "*/v2/manager/municipality",
    method: "PATCH",
    response: ({ body }: { body: unknown }): SettingsUpdate => ({
      settings: { ...settings, ...(body as SettingsPatch), ...result },
      affectedBookings: affected,
    }),
  });
}

async function open() {
  await commands.navigate("/admin/vilaverde/axustes");
  await render(<App />);
  await expect
    .element(page.getByRole("heading", { level: 1, name: "Axustes" }))
    .toBeVisible();
}

describe("municipal settings", () => {
  test("should send the new cancellation deadline when a manager saves the booking rules", async () => {
    stubManager();
    const { spy } = stubPatch();
    await open();
    const rules = page.getByRole("region", { name: "Regras de reserva" });
    await rules
      .getByRole("spinbutton", {
        name: "Prazo para cambiar ou cancelar (horas antes)",
      })
      .fill("48");
    await rules.getByRole("button", { name: "Gardar cambios" }).click();
    await expect
      .element(rules.getByRole("status"))
      .toHaveTextContent("Cambios gardados.");
    expect(spy.mock.calls.at(-1)![0].body).toEqual({
      advanceDays: 14,
      cancellationHours: 48,
      maxActiveBookings: 5,
    });
  });

  test("should explain an out-of-range rule without calling the API", async () => {
    stubManager();
    const { spy } = stubPatch();
    await open();
    const rules = page.getByRole("region", { name: "Regras de reserva" });
    await rules
      .getByRole("spinbutton", { name: "Antelación máxima (días)" })
      .fill("120");
    await rules.getByRole("button", { name: "Gardar cambios" }).click();
    await expect
      .element(rules.getByText("Indica entre 1 e 90 días."))
      .toBeVisible();
    expect(spy).not.toHaveBeenCalled();
  });

  test("should publish a new privacy notice version in both languages", async () => {
    stubManager();
    const { spy } = stubPatch({ legalVersion: "2026-10-27.1" });
    await open();
    const legal = page.getByRole("region", { name: "Aviso de privacidade" });
    await legal
      .getByRole("textbox", { name: "Texto en galego" })
      .fill("Novo aviso de privacidade do concello.");
    await legal
      .getByRole("textbox", { name: "Texto en castelán" })
      .fill("Nuevo aviso de privacidad del ayuntamiento.");
    await legal.getByRole("button", { name: "Publicar nova versión" }).click();
    await expect
      .element(legal.getByRole("status"))
      .toHaveTextContent("Publicada a versión 2026-10-27.1");
    expect(spy.mock.calls.at(-1)![0].body).toEqual({
      legalTexts: {
        gl: "Novo aviso de privacidade do concello.",
        es: "Nuevo aviso de privacidad del ayuntamiento.",
      },
    });
  });

  test("should reject a primary colour below AA contrast before saving", async () => {
    stubManager();
    const { spy } = stubPatch();
    await open();
    const branding = page.getByRole("region", { name: "Imaxe do concello" });
    const color = branding.getByRole("textbox", { name: "Cor principal" });
    await color.fill("#ffd700");
    await branding.getByRole("button", { name: "Gardar cambios" }).click();
    await expect
      .element(branding.getByText(/non chega ao contraste mínimo/))
      .toBeVisible();
    expect(spy).not.toHaveBeenCalled();
    await color.fill("#1a4d8f");
    await branding.getByRole("button", { name: "Gardar cambios" }).click();
    await expect
      .element(branding.getByRole("status"))
      .toHaveTextContent("Cambios gardados.");
    expect(spy.mock.calls.at(-1)![0].body).toEqual({
      primaryColor: "#1a4d8f",
    });
  });

  test("should save a yearly holiday as an all-day iCalendar event and report kept bookings", async () => {
    stubManager();
    const { spy } = stubPatch({}, 2);
    await open();
    const holidays = page.getByRole("region", { name: "Festivos municipais" });
    await holidays.getByLabelText("Data", { exact: true }).fill("2026-12-25");
    await holidays
      .getByRole("textbox", { name: "Nome", exact: true })
      .fill("Nadal");
    await holidays.getByRole("button", { name: "Engadir festivo" }).click();
    await expect
      .element(holidays.getByRole("listitem").getByText("Nadal"))
      .toBeVisible();
    await holidays.getByRole("button", { name: "Gardar festivos" }).click();
    await expect
      .element(holidays.getByText(/caen nun festivo novo \(mantéñense\): 2/))
      .toBeVisible();
    const calendar = (spy.mock.calls.at(-1)![0].body as SettingsPatch)
      .holidaysCalendar;
    expect(calendar).toContain("DTSTART;VALUE=DATE:20261225");
    expect(calendar).toContain("RRULE:FREQ=YEARLY");
    expect(calendar).toContain("SUMMARY:Nadal");
  });

  test("should use the municipality's default language until the person picks one", async () => {
    stubManager({ locale: "es" });
    await commands.navigate("/admin/vilaverde/axustes");
    await render(<App />);
    await expect
      .element(page.getByRole("heading", { level: 1, name: "Ajustes" }))
      .toBeVisible();
    await page.getByRole("button", { name: "GL", exact: true }).click();
    await expect
      .element(page.getByRole("heading", { level: 1, name: "Axustes" }))
      .toBeVisible();
    expect(localStorage.getItem("quenda.locale")).toBe("gl");
  });
  test("should rotate the pass key and show the webhook secret only once", async () => {
    stubManager();
    const rotation = stubJsonResponse({
      path: "*/v2/manager/access-keys/rotation",
      method: "POST",
      status: 201,
      response: { kid: "new-key" },
    });
    const webhook = stubJsonResponse({
      path: "*/v2/manager/access-webhook",
      method: "PUT",
      response: { url: "https://accesos.example/hook", secret: "s3cr3t" },
    });
    await commands.navigate("/admin/vilaverde/axustes");
    await render(<App />);
    const section = page.getByRole("region", { name: "Acceso con QR" });
    await section.getByRole("button", { name: "Renovar a clave" }).click();
    await section
      .getByRole("group", { name: "Renovar a clave dos pases?" })
      .getByRole("button", { name: "Renovar a clave" })
      .click();
    await expect.element(section.getByText("Clave renovada.")).toBeVisible();
    expect(rotation.spy).toHaveBeenCalledTimes(1);
    await section
      .getByLabelText("Enderezo do sistema de accesos")
      .fill("ftp://accesos.example");
    await section.getByRole("button", { name: "Gardar o conector" }).click();
    await expect
      .element(
        section.getByText("O enderezo debe comezar por http:// ou https://."),
      )
      .toBeVisible();
    expect(webhook.spy).not.toHaveBeenCalled();
    await section
      .getByLabelText("Enderezo do sistema de accesos")
      .fill("https://accesos.example/hook");
    await section.getByRole("button", { name: "Gardar o conector" }).click();
    await expect.element(section.getByText("s3cr3t")).toBeVisible();
    expect(webhook.spy).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { url: "https://accesos.example/hook", rotateSecret: false },
      }),
    );
  });
  test("should send the offered user categories in catalogue order", async () => {
    stubManager({ enabledCategories: ["senior"] });
    const { spy } = stubPatch();
    await open();
    const section = page.getByRole("region", { name: "Categorías de usuario" });
    await section.getByRole("checkbox", { name: "Persoa empadroada" }).click();
    await section
      .getByRole("checkbox", { name: "Persoa con discapacidade" })
      .click();
    await expect
      .element(
        section.getByText("A discapacidade é un dato de saúde", {
          exact: false,
        }),
      )
      .toBeVisible();
    await section.getByRole("button", { name: "Gardar cambios" }).click();
    await expect
      .element(section.getByRole("status"))
      .toHaveTextContent("Cambios gardados.");
    expect(spy.mock.calls.at(-1)![0].body).toEqual({
      enabledCategories: ["resident", "disability", "senior"],
    });
  });

  test("should save the open data licence and an upper-case DIR3 code, rejecting a malformed one", async () => {
    stubManager();
    const { spy } = stubPatch();
    await open();
    const section = page.getByRole("region", { name: "Datos abertos" });
    await section
      .getByRole("combobox", { name: "Licenza dos datos" })
      .selectOptions("CC0-1.0");
    const dir3 = section.getByRole("textbox", {
      name: "Código DIR3 do concello",
    });
    await dir3.fill("L0136");
    await section.getByRole("button", { name: "Gardar cambios" }).click();
    await expect
      .element(section.getByText("O código DIR3 ten nove letras ou números."))
      .toBeVisible();
    expect(spy).not.toHaveBeenCalled();
    await dir3.fill("l01360000");
    await section.getByRole("button", { name: "Gardar cambios" }).click();
    await expect
      .element(section.getByRole("status"))
      .toHaveTextContent("Cambios gardados.");
    expect(spy.mock.calls.at(-1)![0].body).toEqual({
      dataLicense: "CC0-1.0",
      dir3Code: "L01360000",
    });
  });
  test("should rename, hide and add sports in the municipality's catalogue", async () => {
    stubManager();
    const updated = stubJsonResponse({
      path: "*/v2/manager/sports/:code",
      method: "PATCH",
      response: ({ body }: { body: unknown }) => body,
    });
    const created = stubJsonResponse({
      path: "*/v2/manager/sports",
      method: "POST",
      status: 201,
      response: ({ body }: { body: unknown }) => body,
    });
    await open();
    const section = page.getByRole("region", { name: "Deportes" });
    await section
      .getByRole("textbox", { name: "Nome en galego: futsal" })
      .fill("Fútbol sala e balonmán");
    await section
      .getByRole("checkbox", { name: "Oculto: Fútbol sala e balonmán" })
      .click();
    await section
      .getByRole("button", { name: "Gardar cambios: Fútbol sala e balonmán" })
      .click();
    await expect
      .element(section.getByRole("status"))
      .toHaveTextContent("Deporte gardado.");
    expect(updated.spy.mock.calls[0][0]).toMatchObject({
      url: expect.stringContaining("/manager/sports/futsal"),
      body: {
        name: { gl: "Fútbol sala e balonmán", es: "Fútbol sala" },
        hidden: true,
      },
    });
    const form = section.getByRole("form", { name: "Engadir deporte" });
    await form.getByRole("button", { name: "Engadir deporte" }).click();
    await expect
      .element(section.getByRole("alert"))
      .toHaveTextContent("Escribe o nome do deporte (polo menos dúas letras).");
    expect(created.spy).not.toHaveBeenCalled();
    await form
      .getByRole("textbox", { name: "Nome en galego" })
      .fill("Balonmán praia");
    await expect
      .element(form.getByText("Código: balonman-praia"))
      .toBeVisible();
    await form.getByRole("button", { name: "Engadir deporte" }).click();
    await expect
      .element(section.getByRole("status"))
      .toHaveTextContent("Deporte engadido.");
    expect(created.spy.mock.calls[0][0].body).toMatchObject({
      code: "balonman-praia",
      name: { gl: "Balonmán praia", es: "Balonmán praia" },
      hidden: false,
    });
  });
  test("should explain that a sport in use can only be hidden, and remove an unused one", async () => {
    stubManager();
    const removal = stubJsonResponse({
      path: "*/v2/manager/sports/:code",
      method: "DELETE",
      status: 409,
      response: { code: "sport_in_use", detail: "" },
    });
    await open();
    const section = page.getByRole("region", { name: "Deportes" });
    await section
      .getByRole("button", { name: "Eliminar o deporte: Pádel" })
      .click();
    await expect
      .element(section.getByRole("alert"))
      .toHaveTextContent(
        "Hai instalacións ou clubs con este deporte: non se pode eliminar, pero si ocultar.",
      );
    expect(removal.spy.mock.calls[0][0].url).toContain("/manager/sports/padel");
    stubJsonResponse({
      path: "*/v2/manager/sports/:code",
      method: "DELETE",
      status: 204,
      response: undefined,
    });
    await section
      .getByRole("button", { name: "Eliminar o deporte: Baloncesto" })
      .click();
    await expect
      .element(section.getByRole("status"))
      .toHaveTextContent("Deporte eliminado.");
  });

  test("should switch web analytics on for the council", async () => {
    stubManager();
    const { spy } = stubPatch();
    await open();
    const section = page.getByRole("region", { name: "Analítica web" });
    await expect
      .element(section.getByText("A analítica web está desactivada."))
      .toBeVisible();
    await section
      .getByRole("checkbox", { name: "Contar as visitas á app neste concello" })
      .click({ force: true });
    await section.getByRole("button", { name: "Gardar cambios" }).click();
    await expect
      .element(section.getByRole("status"))
      .toHaveTextContent("Cambios gardados.");
    expect(spy.mock.calls.at(-1)![0].body).toEqual({ analyticsEnabled: true });
  });
  test("should explain that analytics cannot be switched on without the deployment's Umami", async () => {
    stubManager({ analyticsAvailable: false } as Partial<MunicipalitySettings>);
    await open();
    const section = page.getByRole("region", { name: "Analítica web" });
    await expect
      .element(section.getByText(/O despregamento non ten Umami/))
      .toBeVisible();
    await expect.element(section.getByRole("checkbox")).not.toBeInTheDocument();
  });
  test("should draw the installed app's icon from a new logo and send it after the logo (#24)", async () => {
    stubManager();
    const logo = stubJsonResponse({
      path: "*/v2/manager/municipality/logo",
      method: "PUT",
      status: 204,
      response: null,
    });
    const icon = stubJsonResponse({
      path: "*/v2/manager/municipality/icon",
      method: "PUT",
      status: 204,
      response: null,
    });
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 100;
    canvas.getContext("2d")!.fillRect(0, 0, 300, 100);
    const png = await new Promise<Blob>((resolve) =>
      canvas.toBlob((blob) => resolve(blob!), "image/png"),
    );
    await open();
    await page
      .getByLabelText("Subir logotipo")
      .upload(new File([png], "logo.png", { type: "image/png" }));
    await expect.element(page.getByText("Logotipo actualizado.")).toBeVisible();
    expect(logo.spy).toHaveBeenCalledTimes(1);
    expect(icon.spy).toHaveBeenCalledTimes(1);
  });
});
