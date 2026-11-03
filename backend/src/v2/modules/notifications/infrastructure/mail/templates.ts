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
      waitlist_offer: "Quedou libre a quenda que esperabas",
      enrolment_confirmed: "Inscrición confirmada",
      enrolment_waiting: "Estás na lista de espera",
      enrolment_promoted: "Xa tes praza",
      enrolment_removed: "Baixa nunha actividade",
      activity_session_cancelled: "Sesión anulada",
      activity_cancelled: "Actividade anulada",
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
      waitlist_offer:
        "Quedou libre unha praza na quenda da túa lista de espera. Gardámola para ti: confírmaa nas túas reservas antes da hora indicada ou pasará á seguinte persoa.",
      enrolment_confirmed:
        "A túa inscrición está confirmada: tes praza na actividade. A próxima sesión é:",
      enrolment_waiting:
        "A actividade está completa e quedas na lista de espera. Se queda libre unha praza, pasa a ti sen ter que facer nada e avisámoste.",
      enrolment_promoted:
        "Quedou libre unha praza e xa é túa: estás inscrito ou inscrita na actividade. A próxima sesión é:",
      enrolment_removed: "O concello deute de baixa nesta actividade.",
      activity_session_cancelled:
        "O concello anulou unha sesión da actividade na que estás inscrito ou inscrita:",
      activity_cancelled:
        "O concello anulou a actividade na que estabas inscrito ou inscrita.",
    },
    holdUntil: "Gardada ata",
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
    waitlistFooter: (name: string) =>
      `Recibes este correo porque te apuntaches a unha lista de espera no ${name}. Se tes dúbidas, responde a esta mensaxe.`,
    enrolmentFooter: (name: string) =>
      `Recibes este correo porque te inscribiches nunha actividade do ${name}. Se tes dúbidas, responde a esta mensaxe.`,
    activity: "Actividade",
    cancelledDates: "Sesións anuladas",
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
      waitlist_offer: "Ha quedado libre el turno que esperabas",
      enrolment_confirmed: "Inscripción confirmada",
      enrolment_waiting: "Estás en la lista de espera",
      enrolment_promoted: "Ya tienes plaza",
      enrolment_removed: "Baja en una actividad",
      activity_session_cancelled: "Sesión anulada",
      activity_cancelled: "Actividad anulada",
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
      waitlist_offer:
        "Ha quedado libre una plaza en el turno de tu lista de espera. La guardamos para ti: confírmala en tus reservas antes de la hora indicada o pasará a la siguiente persona.",
      enrolment_confirmed:
        "Tu inscripción está confirmada: tienes plaza en la actividad. La próxima sesión es:",
      enrolment_waiting:
        "La actividad está completa y quedas en la lista de espera. Si queda libre una plaza, pasa a ti sin hacer nada y te avisamos.",
      enrolment_promoted:
        "Ha quedado libre una plaza y ya es tuya: estás inscrito o inscrita en la actividad. La próxima sesión es:",
      enrolment_removed:
        "El ayuntamiento te ha dado de baja en esta actividad.",
      activity_session_cancelled:
        "El ayuntamiento ha anulado una sesión de la actividad en la que estás inscrito o inscrita:",
      activity_cancelled:
        "El ayuntamiento ha anulado la actividad en la que estabas inscrito o inscrita.",
    },
    holdUntil: "Guardada hasta",
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
    waitlistFooter: (name: string) =>
      `Recibes este correo porque te apuntaste a una lista de espera en el ${name}. Si tienes dudas, responde a este mensaje.`,
    enrolmentFooter: (name: string) =>
      `Recibes este correo porque te inscribiste en una actividad del ${name}. Si tienes dudas, responde a este mensaje.`,
    activity: "Actividad",
    cancelledDates: "Sesiones anuladas",
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
  const activityName = delivery.activity
    ? delivery.activity.name[delivery.locale] || delivery.activity.name.gl
    : null;
  // Notices that end an enrolment have no session to come; the others name the one they are about.
  const session =
    delivery.kind !== "enrolment_removed" &&
    delivery.kind !== "activity_cancelled" &&
    delivery.kind !== "enrolment_waiting";
  const dateOf = (instant: Temporal.Instant) => {
    const zoned = instant.toZonedDateTimeISO(zone);
    return `${capitalise(
      zoned.toPlainDate().toLocaleString(TAGS[delivery.locale], {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    )}, ${clock(zoned)}`;
  };
  const facts: [string, string][] = [
    ...(activityName
      ? ([[t.activity, activityName]] as [string, string][])
      : []),
    [t.facility, delivery.facility.name],
    ...(session
      ? ([
          [t.date, day],
          [t.time, `${clock(start)}–${clock(end)}`],
        ] as [string, string][])
      : []),
    ...(delivery.cancelledDates.length > 1
      ? ([
          [t.cancelledDates, delivery.cancelledDates.map(dateOf).join("; ")],
        ] as [string, string][])
      : []),
    [t.address, delivery.facility.address],
    ...(delivery.activity && delivery.noticeReason
      ? ([[t.reason, delivery.noticeReason]] as [string, string][])
      : []),
    ...(delivery.kind === "waitlist_offer" && delivery.offerExpiresAt
      ? ([
          [
            t.holdUntil,
            clock(delivery.offerExpiresAt.toZonedDateTimeISO(zone)),
          ],
        ] as [string, string][])
      : []),
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
  const subject = `${t.subject[delivery.kind]}: ${activityName ?? delivery.facility.name}`;
  const footer = (
    delivery.activity
      ? t.enrolmentFooter
      : delivery.kind === "waitlist_offer"
        ? t.waitlistFooter
        : t.footer
  )(delivery.municipality.name);
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
