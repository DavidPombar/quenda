// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
import type { Delivery } from "../../domain/delivery.read-model";
type Locale = Delivery["locale"];
type Standing = NonNullable<Delivery["standing"]>;
const TAGS: Record<Locale, string> = { gl: "gl-ES", es: "es-ES" };
const copy = {
  gl: {
    subject: {
      confirmed: "Reserva confirmada",
      rescheduled: "Reserva cambiada",
      cancelled: "Reserva cancelada",
      cancelled_by_municipality: "Reserva cancelada polo concello",
      reminder: "Lembranza da túa reserva",
      no_show: "Non presentado",
      blocked: "Reservas bloqueadas temporalmente",
      unblocked: "Xa podes reservar de novo",
    },
    intro: {
      confirmed: "A túa reserva está confirmada.",
      rescheduled: "Cambiaches a túa reserva. Este é o novo horario:",
      cancelled: "A túa reserva foi cancelada.",
      cancelled_by_municipality: "O concello cancelou a túa reserva.",
      reminder: "Lembrámosche que tes unha reserva:",
      no_show: "O concello marcou esta reserva como non presentada:",
      blocked:
        "Acumulaches demasiadas ausencias e non podes facer reservas novas durante uns días.",
      unblocked:
        "O concello corrixiu unha ausencia e retirou o bloqueo das túas reservas.",
    },
    standing: (s: Standing, until: string | null) =>
      until
        ? `Non podes reservar ata o ${until}.`
        : s.limit === 0
          ? "Este concello non aplica penalizacións por ausencias."
          : `Ausencias recentes: ${s.count} de ${s.limit}. Podes faltar ${s.remaining} ${s.remaining === 1 ? "vez" : "veces"} máis antes do bloqueo.`,
    standingLabel: "Situación",
    facility: "Instalación",
    date: "Data",
    time: "Hora",
    address: "Enderezo",
    reason: "Motivo",
    bookings: "Ver as miñas reservas",
    footer: (name: string) =>
      `Recibes este correo porque tes unha reserva no ${name}. Se tes dúbidas, responde a esta mensaxe.`,
    unsubscribe:
      "Non queres recibir este tipo de aviso por correo? Date de baixa:",
  },
  es: {
    subject: {
      confirmed: "Reserva confirmada",
      rescheduled: "Reserva modificada",
      cancelled: "Reserva cancelada",
      cancelled_by_municipality: "Reserva cancelada por el ayuntamiento",
      reminder: "Recordatorio de tu reserva",
      no_show: "No presentado",
      blocked: "Reservas bloqueadas temporalmente",
      unblocked: "Ya puedes reservar de nuevo",
    },
    intro: {
      confirmed: "Tu reserva está confirmada.",
      rescheduled: "Has cambiado tu reserva. Este es el nuevo horario:",
      cancelled: "Tu reserva ha sido cancelada.",
      cancelled_by_municipality: "El ayuntamiento ha cancelado tu reserva.",
      reminder: "Te recordamos que tienes una reserva:",
      no_show: "El ayuntamiento ha marcado esta reserva como no presentada:",
      blocked:
        "Has acumulado demasiadas ausencias y no puedes hacer reservas nuevas durante unos días.",
      unblocked:
        "El ayuntamiento ha corregido una ausencia y ha retirado el bloqueo de tus reservas.",
    },
    standing: (s: Standing, until: string | null) =>
      until
        ? `No puedes reservar hasta el ${until}.`
        : s.limit === 0
          ? "Este ayuntamiento no aplica penalizaciones por ausencias."
          : `Ausencias recientes: ${s.count} de ${s.limit}. Puedes faltar ${s.remaining} ${s.remaining === 1 ? "vez" : "veces"} más antes del bloqueo.`,
    standingLabel: "Situación",
    facility: "Instalación",
    date: "Fecha",
    time: "Hora",
    address: "Dirección",
    reason: "Motivo",
    bookings: "Ver mis reservas",
    footer: (name: string) =>
      `Recibes este correo porque tienes una reserva en el ${name}. Si tienes dudas, responde a este mensaje.`,
    unsubscribe:
      "¿No quieres recibir este tipo de aviso por correo? Date de baja:",
  },
} as const;
// Municipality names already read "Concello de…"; the article above suits both languages.
function escape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function capitalise(value: string) {
  return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}
function clock(value: { hour: number; minute: number }) {
  return `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;
}
export interface RenderedMail {
  subject: string;
  text: string;
  html: string;
}
export function renderMail(
  delivery: Delivery,
  links: { bookings: string; unsubscribe: string | null },
): RenderedMail {
  const t = copy[delivery.locale];
  const zone = delivery.municipality.timezone;
  const start = delivery.start.toZonedDateTimeISO(zone);
  const end = delivery.end.toZonedDateTimeISO(zone);
  const day = capitalise(
    start.toPlainDate().toLocaleString(TAGS[delivery.locale], {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  );
  const facts: [string, string][] = [
    [t.facility, delivery.facility.name],
    [t.date, day],
    [t.time, `${clock(start)}–${clock(end)}`],
    [t.address, delivery.facility.address],
    ...(delivery.kind === "cancelled_by_municipality" &&
    delivery.cancellationReason
      ? ([[t.reason, delivery.cancellationReason]] as [string, string][])
      : []),
    ...(delivery.standing
      ? ([
          [
            t.standingLabel,
            t.standing(
              delivery.standing,
              delivery.standing.blockedUntil
                ? Temporal.Instant.from(delivery.standing.blockedUntil)
                    .toZonedDateTimeISO(zone)
                    .toPlainDate()
                    .toLocaleString(TAGS[delivery.locale], {
                      day: "numeric",
                      month: "long",
                    })
                : null,
            ),
          ],
        ] as [string, string][])
      : []),
  ];
  const subject = `${t.subject[delivery.kind]}: ${delivery.facility.name}`;
  const footer = t.footer(delivery.municipality.name);
  const text = [
    t.intro[delivery.kind],
    "",
    ...facts.map(([label, value]) => `${label}: ${value}`),
    "",
    `${t.bookings}: ${links.bookings}`,
    "",
    footer,
    ...(links.unsubscribe ? [`${t.unsubscribe} ${links.unsubscribe}`] : []),
  ].join("\n");
  const html = `<!doctype html>
<html lang="${delivery.locale}"><body style="font-family:sans-serif;color:#14261d;line-height:1.5">
<p>${escape(t.intro[delivery.kind])}</p>
<table role="presentation" style="border-collapse:collapse">${facts
    .map(
      ([label, value]) =>
        `<tr><th scope="row" style="text-align:left;padding:2px 16px 2px 0">${escape(label)}</th><td>${escape(value)}</td></tr>`,
    )
    .join("")}</table>
<p><a href="${escape(links.bookings)}" style="color:#1f5b43">${escape(t.bookings)}</a></p>
<p style="color:#4a5a51;font-size:14px">${escape(footer)}${
    links.unsubscribe
      ? `<br>${escape(t.unsubscribe)} <a href="${escape(links.unsubscribe)}" style="color:#1f5b43">${escape(links.unsubscribe)}</a>`
      : ""
  }</p>
</body></html>`;
  return { subject, text, html };
}
