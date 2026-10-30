// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect, vi, afterEach } from "vitest";
import { page, commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { pushDeviceRepository } from "@/repositories/push-device.repository";
import {
  notificationSettings,
  stubAccount,
  stubNotificationSettings,
  stubShell,
} from "@/test/fixtures";
const device = {
  endpoint: "https://push.example.org/send/device-1",
  keys: { p256dh: "BPublicDeviceKey", auth: "secret" },
};
/** The browser's side of push, so no real permission prompt or worker is involved. */
function stubBrowser(
  overrides: Partial<{
    support: ReturnType<typeof pushDeviceRepository.support>;
    permission: NotificationPermission;
    endpoint: string | null;
  }> = {},
) {
  const state = {
    support: "supported" as const,
    permission: "default" as NotificationPermission,
    endpoint: null as string | null,
    ...overrides,
  };
  vi.spyOn(pushDeviceRepository, "support").mockImplementation(
    () => state.support,
  );
  vi.spyOn(pushDeviceRepository, "permission").mockImplementation(
    () => state.permission,
  );
  vi.spyOn(pushDeviceRepository, "current").mockImplementation(async () =>
    state.endpoint ? ({ endpoint: state.endpoint } as PushSubscription) : null,
  );
  const subscribe = vi
    .spyOn(pushDeviceRepository, "subscribe")
    .mockImplementation(async () => {
      state.permission = "granted";
      state.endpoint = device.endpoint;
      return device;
    });
  return { subscribe };
}
async function open() {
  await commands.navigate("/app/vilaverde/conta");
  await render(<App />);
  const section = page.getByRole("region", { name: "Avisos" });
  await expect.element(section).toBeVisible();
  return section;
}
afterEach(() => {
  vi.restoreAllMocks();
});
describe("Notice preferences", () => {
  test("should save the choice for every notice and channel at once", async () => {
    stubShell(true);
    stubAccount();
    stubBrowser();
    const { spy } = stubJsonResponse({
      path: "*/v2/citizen/me/notification-preferences",
      method: "PUT",
      status: 204,
    });
    const section = await open();
    const reminderEmail = section.getByRole("checkbox", {
      name: "Lembranza antes da reserva Por correo",
    });
    await expect.element(reminderEmail).toBeChecked();
    await expect
      .element(section.getByText("Chega 24 horas antes do inicio."))
      .toBeVisible();
    await reminderEmail.click({ force: true });
    await section
      .getByRole("checkbox", { name: "Ausencias e bloqueos No dispositivo" })
      .click({ force: true });
    await section.getByRole("button", { name: "Gardar avisos" }).click();
    await expect
      .element(section.getByRole("status"))
      .toHaveTextContent("Avisos gardados.");
    expect(spy.mock.calls.at(-1)![0].body).toEqual({
      ...notificationSettings.preferences,
      reminder: { email: false, push: true },
      penalty: { email: false, push: true },
    });
  });
  test("should not offer email notices when the account has no address", async () => {
    stubShell(true);
    stubAccount({ email: null });
    stubBrowser();
    const section = await open();
    await expect
      .element(section.getByText(/Esta conta non ten correo/))
      .toBeVisible();
    await expect
      .element(
        section.getByRole("checkbox", {
          name: "Confirmación da reserva Por correo",
        }),
      )
      .toBeDisabled();
    await expect
      .element(
        section.getByRole("checkbox", {
          name: "Confirmación da reserva No dispositivo",
        }),
      )
      .toBeEnabled();
  });
  test("should ask for the browser's permission only when the person turns notices on", async () => {
    stubShell(true);
    stubAccount();
    const { subscribe } = stubBrowser();
    const { spy } = stubJsonResponse({
      path: "*/v2/citizen/me/push-subscriptions",
      method: "POST",
      status: 204,
    });
    const section = await open();
    const enable = section.getByRole("button", {
      name: "Activar avisos neste dispositivo",
    });
    await expect.element(enable).toBeVisible();
    expect(subscribe).not.toHaveBeenCalled();
    stubNotificationSettings({
      push: { ...notificationSettings.push, devices: 1 },
    });
    await enable.click();
    await expect
      .element(section.getByText("Este dispositivo recibe avisos."))
      .toBeVisible();
    expect(subscribe).toHaveBeenCalledWith("BPublicKeyForTests");
    expect(spy.mock.calls.at(-1)![0].body).toEqual(device);
    await expect
      .element(
        section.getByRole("button", { name: "Desactivar neste dispositivo" }),
      )
      .toBeVisible();
  });
  test("should explain that iPhone and iPad need the app on the home screen", async () => {
    stubShell(true);
    stubAccount();
    stubBrowser({ support: "ios_home_screen" });
    const section = await open();
    await expect
      .element(section.getByText(/engade primeiro Quenda á pantalla de inicio/))
      .toBeVisible();
    await expect
      .element(section.getByRole("button", { name: /Activar avisos/ }))
      .not.toBeInTheDocument();
  });
  test("should explain how to allow notices the browser blocks", async () => {
    stubShell(true);
    stubAccount();
    stubBrowser({ permission: "denied" });
    const section = await open();
    await expect
      .element(section.getByText(/Os avisos están bloqueados/))
      .toBeVisible();
  });
  test("should say so when the municipality does not offer push notices", async () => {
    stubShell(true);
    stubAccount();
    stubNotificationSettings({
      push: { available: false, publicKey: null, devices: 0 },
    });
    stubBrowser();
    const section = await open();
    await expect
      .element(section.getByText(/aínda non ofrece avisos no dispositivo/))
      .toBeVisible();
  });
});
