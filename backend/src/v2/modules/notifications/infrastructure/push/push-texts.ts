// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Delivery } from "../../domain/delivery.read-model";
/**
 * Push notices say only what kind of thing happened: no names, places or times, because the
 * lock screen can be seen by others. The details are in the app.
 */
const texts: Record<Delivery["locale"], Record<Delivery["kind"], string>> = {
  gl: {
    confirmed: "Tes unha reserva confirmada.",
    rescheduled: "Tes un cambio nunha reserva.",
    cancelled: "Cancelouse unha das túas reservas.",
    cancelled_by_municipality: "O concello cancelou unha das túas reservas.",
    reminder: "Tes unha reserva en breve.",
    no_show: "Tes un aviso sobre unha ausencia.",
    blocked: "As túas reservas están bloqueadas temporalmente.",
    unblocked: "Xa podes reservar de novo.",
    waitlist_offer: "Quedou libre unha praza que esperabas. Confírmaa axiña.",
    enrolment_confirmed: "Tes praza nunha actividade.",
    enrolment_waiting: "Estás na lista de espera dunha actividade.",
    enrolment_promoted: "Quedou libre unha praza nunha actividade e xa é túa.",
    enrolment_removed: "Tes un aviso sobre unha actividade.",
    activity_session_cancelled: "Anulouse unha sesión dunha actividade.",
    activity_cancelled: "Anulouse unha actividade na que estabas.",
  },
  es: {
    confirmed: "Tienes una reserva confirmada.",
    rescheduled: "Tienes un cambio en una reserva.",
    cancelled: "Se ha cancelado una de tus reservas.",
    cancelled_by_municipality:
      "El ayuntamiento ha cancelado una de tus reservas.",
    reminder: "Tienes una reserva en breve.",
    no_show: "Tienes un aviso sobre una ausencia.",
    blocked: "Tus reservas están bloqueadas temporalmente.",
    unblocked: "Ya puedes reservar de nuevo.",
    waitlist_offer:
      "Ha quedado libre una plaza que esperabas. Confírmala pronto.",
    enrolment_confirmed: "Tienes plaza en una actividad.",
    enrolment_waiting: "Estás en la lista de espera de una actividad.",
    enrolment_promoted:
      "Ha quedado libre una plaza en una actividad y ya es tuya.",
    enrolment_removed: "Tienes un aviso sobre una actividad.",
    activity_session_cancelled: "Se ha anulado una sesión de una actividad.",
    activity_cancelled: "Se ha anulado una actividad en la que estabas.",
  },
};
export interface PushPayload {
  title: string;
  body: string;
  /** Page the notice opens, inside the citizen app. */
  url: string;
  /** Groups notices of the same reservation, offer or enrolment on the device. */
  tag: string;
}
export function pushPayload(delivery: Delivery, url: string): PushPayload {
  return {
    title: delivery.municipality.name,
    body: texts[delivery.locale][delivery.kind],
    url,
    tag: `quenda-${delivery.bookingId ?? delivery.waitlistEntryId ?? delivery.enrolmentId}`,
  };
}
