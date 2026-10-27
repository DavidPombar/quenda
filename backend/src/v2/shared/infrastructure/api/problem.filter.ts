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
      "Hai reservas futuras. Non se pode cambiar o horario ou pechar a instalación.",
    demo_disabled: "O acceso de demostración está desactivado.",
    consent_required:
      "Debes aceptar o aviso de privacidade vixente para continuar.",
    insufficient_contrast:
      "A cor non ten contraste suficiente co branco (mínimo 4,5:1, WCAG AA).",
    invalid_holidays:
      "O calendario de festivos non é un iCalendar válido de días completos.",
    unsupported_logo: "O logotipo debe ser unha imaxe PNG, JPEG ou WebP.",
    logo_too_large: "O logotipo non pode superar os 2 MB.",
    slug_taken: "Xa existe un concello con ese identificador.",
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
      "Hay reservas futuras. No se puede cambiar el horario o cerrar la instalación.",
    demo_disabled: "El acceso de demostración está desactivado.",
    consent_required:
      "Debes aceptar el aviso de privacidad vigente para continuar.",
    insufficient_contrast:
      "El color no tiene contraste suficiente con el blanco (mínimo 4,5:1, WCAG AA).",
    invalid_holidays:
      "El calendario de festivos no es un iCalendar válido de días completos.",
    unsupported_logo: "El logotipo debe ser una imagen PNG, JPEG o WebP.",
    logo_too_large: "El logotipo no puede superar los 2 MB.",
    slug_taken: "Ya existe un ayuntamiento con ese identificador.",
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
