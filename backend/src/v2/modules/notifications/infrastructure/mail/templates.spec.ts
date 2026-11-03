// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import type { Delivery } from "../../domain/delivery.read-model";
import { pushPayload } from "../push/push-texts";
import { renderMail } from "./templates";
const delivery: Delivery = {
  id: "o1",
  kind: "enrolment_promoted",
  channel: "email",
  tenantId: "t1",
  userId: "u1",
  bookingId: null,
  waitlistEntryId: null,
  enrolmentId: "e1",
  activity: { name: { gl: "Natación infantil", es: "" } },
  enrolmentStatus: "enrolled",
  participant: null,
  noticeReason: null,
  cancelledDates: [],
  attempts: 1,
  email: "persoa@example.invalid",
  locale: "gl",
  bookingStatus: null,
  offerExpiresAt: null,
  offerOpen: false,
  municipality: {
    slug: "vilaverde",
    name: "Concello de Vilaverde",
    timezone: "Europe/Madrid",
    senderName: "Deportes",
    replyTo: "deportes@example.invalid",
  },
  facility: { name: "Piscina municipal", address: "Rúa do Río, 5" },
  webhook: null,
  facilityId: "f1",
  openingCalendar: "",
  preference: null,
  preferenceVersion: "0",
  standing: null,
  cancellationReason: null,
  start: Temporal.Instant.from("2026-11-05T16:00:00Z"),
  end: Temporal.Instant.from("2026-11-05T17:00:00Z"),
};
const links = { bookings: "https://example.invalid/app", unsubscribe: null };
describe("enrolment notices (#97)", () => {
  it("should name the activity and its next session when a place moves up", () => {
    const mail = renderMail(delivery, links);
    expect(mail.subject).toBe("Xa tes praza: Natación infantil");
    expect(mail.text).toContain("Actividade: Natación infantil");
    expect(mail.text).toContain("Hora: 17:00–18:00");
    expect(mail.text).toContain("te inscribiches nunha actividade");
  });
  it("should list every date a closure cancels, with its reason, in Spanish", () => {
    const mail = renderMail(
      {
        ...delivery,
        kind: "activity_session_cancelled",
        locale: "es",
        noticeReason: "Vaciado del vaso",
        cancelledDates: [
          Temporal.Instant.from("2026-11-05T16:00:00Z"),
          Temporal.Instant.from("2026-11-10T16:00:00Z"),
        ],
      },
      links,
    );
    expect(mail.subject).toBe("Sesión anulada: Natación infantil");
    expect(mail.text).toContain(
      "Sesiones anuladas: Jueves, 5 de noviembre, 17:00",
    );
    expect(mail.text).toContain("Motivo: Vaciado del vaso");
  });
  it("should name the person in the adult's care who takes part (#97, part C)", () => {
    const mail = renderMail({ ...delivery, participant: "Uxía" }, links);
    expect(mail.text).toContain("Participante: Uxía");
    expect(pushPayload({ ...delivery, participant: "Uxía" }, "/app").body).not.toContain(
      "Uxía",
    );
  });
  it("should leave out the session when the enrolment ends", () => {
    const mail = renderMail(
      {
        ...delivery,
        kind: "enrolment_removed",
        noticeReason: "Sen certificado",
      },
      links,
    );
    expect(mail.text).not.toContain("Hora:");
    expect(mail.text).toContain("Motivo: Sen certificado");
  });
  it("should keep push notices free of the activity and the person", () => {
    const push = pushPayload({ ...delivery, channel: "push" }, "/app");
    expect(push.body).toBe(
      "Quedou libre unha praza nunha actividade e xa é túa.",
    );
    expect(push.tag).toBe("quenda-e1");
  });
});
