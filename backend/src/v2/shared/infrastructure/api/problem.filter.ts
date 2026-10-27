// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { ProblemException } from "./problem";
import { ErrorCode } from "../../application/errors";
const messages: Record<"gl" | "es", Record<ErrorCode, string>> = {
  gl: {
    not_found: "Non atopamos este recurso.",
    forbidden: "Non tes permisos para esta acción.",
    unauthorized: "Inicia sesión para continuar.",
    validation: "Revisa os datos introducidos.",
    slot_taken: "Esta quenda xa está reservada. Escolle outra hora.",
    outside_opening: "A instalación non está aberta nesa quenda.",
    booking_limit: "Acadaches o límite de reservas activas.",
    booking_window: "A data está fóra do prazo de reserva.",
    cancellation_deadline: "Xa rematou o prazo para cambiar ou cancelar.",
    booking_cancelled: "Esta reserva xa está cancelada.",
    id_reused: "Esta solicitude xa se usou con outros datos.",
    calendar_in_use:
      "Hai reservas futuras. Non se pode cambiar o horario; para pechar a instalación indica un motivo e cancelaranse.",
    demo_disabled: "O acceso de demostración está desactivado.",
    consent_required:
      "Debes aceptar o aviso de privacidade vixente para continuar.",
    insufficient_contrast:
      "A cor non ten contraste suficiente co branco (mínimo 4,5:1, WCAG AA).",
    invalid_holidays:
      "O calendario de festivos non é un iCalendar válido de días completos.",
    unsupported_logo: "O logotipo debe ser unha imaxe PNG, JPEG ou WebP.",
    logo_too_large: "O logotipo non pode superar os 2 MB.",
    booking_blocked:
      "Non podes facer reservas temporalmente por acumular ausencias sen avisar.",
    attendance_window:
      "Só se pode marcar como non presentada unha reserva xa comezada e no mesmo día.",
    checked_in:
      "Esta persoa xa rexistrou a entrada; non se pode marcar como non presentada.",
    credential_unavailable:
      "Só as reservas confirmadas e sen rematar teñen código de acceso.",
    invalid_credential:
      "O código non é válido: non é deste concello, foi substituído ou a reserva cambiou.",
    credential_not_yet_valid:
      "Aínda é cedo: o código vale desde a apertura do espazo o día da reserva.",
    credential_expired: "O código caducou: a reserva xa rematou.",
    marked_no_show:
      "A reserva está marcada como non presentada. Corríxea na lista do día se a persoa chegou.",
  },
  es: {
    not_found: "No encontramos este recurso.",
    forbidden: "No tienes permisos para esta acción.",
    unauthorized: "Inicia sesión para continuar.",
    validation: "Revisa los datos introducidos.",
    slot_taken: "Este turno ya está reservado. Elige otra hora.",
    outside_opening: "La instalación no está abierta en ese turno.",
    booking_limit: "Has alcanzado el límite de reservas activas.",
    booking_window: "La fecha está fuera del plazo de reserva.",
    cancellation_deadline: "Ha terminado el plazo para cambiar o cancelar.",
    booking_cancelled: "Esta reserva ya está cancelada.",
    id_reused: "Esta solicitud ya se usó con otros datos.",
    calendar_in_use:
      "Hay reservas futuras. No se puede cambiar el horario; para cerrar la instalación indica un motivo y se cancelarán.",
    demo_disabled: "El acceso de demostración está desactivado.",
    consent_required:
      "Debes aceptar el aviso de privacidad vigente para continuar.",
    insufficient_contrast:
      "El color no tiene contraste suficiente con el blanco (mínimo 4,5:1, WCAG AA).",
    invalid_holidays:
      "El calendario de festivos no es un iCalendar válido de días completos.",
    unsupported_logo: "El logotipo debe ser una imagen PNG, JPEG o WebP.",
    logo_too_large: "El logotipo no puede superar los 2 MB.",
    booking_blocked:
      "No puedes hacer reservas temporalmente por acumular ausencias sin avisar.",
    attendance_window:
      "Solo se puede marcar como no presentada una reserva ya empezada y en el mismo día.",
    checked_in:
      "Esta persona ya registró la entrada; no se puede marcar como no presentada.",
    credential_unavailable:
      "Solo las reservas confirmadas y sin terminar tienen código de acceso.",
    invalid_credential:
      "El código no es válido: no es de este ayuntamiento, se sustituyó o la reserva cambió.",
    credential_not_yet_valid:
      "Todavía es pronto: el código vale desde la apertura del espacio el día de la reserva.",
    credential_expired: "El código ha caducado: la reserva ya terminó.",
    marked_no_show:
      "La reserva está marcada como no presentada. Corrígela en la lista del día si la persona llegó.",
  },
};
@Catch(HttpException)
export class ProblemFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest<Request>();
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const code =
      exception instanceof ProblemException
        ? exception.problem.code
        : status === 401
          ? "unauthorized"
          : status === 403
            ? "forbidden"
            : status === 404
              ? "not_found"
              : "validation";
    const locale = request.headers["accept-language"]?.startsWith("es")
      ? "es"
      : "gl";
    response.status(status).type("application/problem+json").send({
      type: "about:blank",
      title: code,
      status,
      code,
      detail: messages[locale][code],
    });
  }
}
