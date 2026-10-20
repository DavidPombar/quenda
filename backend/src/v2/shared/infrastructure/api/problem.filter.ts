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
    rate_limited: "Demasiadas solicitudes. Agarda un minuto e téntao de novo.",
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
    rate_limited:
      "Demasiadas solicitudes. Espera un minuto e inténtalo de nuevo.",
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
              : status === 429
                ? "rate_limited"
                : "validation";
    const locale = request.headers["accept-language"]?.startsWith("es")
      ? "es"
      : "gl";
    // Named throttlers emit `Retry-After-<name>`; expose the standard header too.
    const retryAfter = response
      .getHeaderNames()
      .find((name) => name.startsWith("retry-after"));
    if (status === 429 && retryAfter)
      response.setHeader("Retry-After", String(response.getHeader(retryAfter)));
    response.status(status).type("application/problem+json").send({
      type: "about:blank",
      title: code,
      status,
      code,
      detail: messages[locale][code],
    });
  }
}
