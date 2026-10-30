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
    oidc_unavailable:
      "A identificación electrónica non está dispoñible agora. Téntao máis tarde.",
    login_expired: "O inicio de sesión caducou. Volve tentalo.",
    login_rejected: "Non se puido completar o inicio de sesión.",
    resource_required: "Escolle a pista ou o espazo que queres reservar.",
    resource_unavailable:
      "Esta pista está fóra de servizo. Escolle outra pista.",
    resource_in_use:
      "Unha pista con reservas pendentes non se pode quitar, poñer fóra de servizo, mover nin dividir ata que esas reservas pasen ou se cancelen.",
    resource_has_history:
      "Unha pista con reservas pasadas non se pode quitar, para conservar o historial. Ponla fóra de servizo.",
    insufficient_contrast:
      "A cor non ten contraste suficiente co branco (mínimo 4,5:1, WCAG AA).",
    invalid_holidays:
      "O calendario de festivos non é un iCalendar válido de días completos.",
    unsupported_logo: "O logotipo debe ser unha imaxe PNG, JPEG ou WebP.",
    logo_too_large: "O logotipo non pode superar os 2 MB.",
    sport_exists: "Xa hai un deporte con ese código ou nome.",
    sport_in_use:
      "Hai instalacións ou clubs con este deporte: non se pode eliminar, pero si ocultar.",
    unsupported_photo: "A foto debe ser unha imaxe PNG, JPEG ou WebP.",
    photo_too_large: "A foto non pode superar os 4 MB.",
    photo_limit: "Cada instalación pode ter ata 10 fotos.",
    slug_taken: "Xa existe un concello con ese identificador.",
    category_not_enabled: "O concello non ofrece esta categoría.",
    category_already_requested:
      "Xa solicitaches esta categoría ou xa a tes verificada.",
    booking_blocked:
      "Non podes facer reservas temporalmente por acumular ausencias sen avisar.",
    attendance_window:
      "Só se pode marcar como non presentada unha reserva xa comezada e no mesmo día.",
    rate_limited: "Demasiadas solicitudes. Agarda un minuto e téntao de novo.",
    unsubscribe_stale:
      "Este enlace xa non serve: cambiaches os avisos despois de recibilo. Xestiónaos en Conta e privacidade.",
    push_unavailable:
      "Este concello non ten activados os avisos no dispositivo.",
    invalid_analytics:
      "Indica o enderezo https do teu Umami e o identificador do sitio, ou deixa os dous baleiros.",
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
    oidc_unavailable:
      "La identificación electrónica no está disponible ahora. Inténtalo más tarde.",
    login_expired: "El inicio de sesión ha caducado. Vuelve a intentarlo.",
    login_rejected: "No se pudo completar el inicio de sesión.",
    resource_required: "Elige la pista o el espacio que quieres reservar.",
    resource_unavailable:
      "Esta pista está fuera de servicio. Elige otra pista.",
    resource_in_use:
      "Una pista con reservas pendientes no se puede quitar, poner fuera de servicio, mover ni dividir hasta que esas reservas pasen o se cancelen.",
    resource_has_history:
      "Una pista con reservas pasadas no se puede quitar, para conservar el historial. Ponla fuera de servicio.",
    insufficient_contrast:
      "El color no tiene contraste suficiente con el blanco (mínimo 4,5:1, WCAG AA).",
    invalid_holidays:
      "El calendario de festivos no es un iCalendar válido de días completos.",
    unsupported_logo: "El logotipo debe ser una imagen PNG, JPEG o WebP.",
    logo_too_large: "El logotipo no puede superar los 2 MB.",
    sport_exists: "Ya hay un deporte con ese código o nombre.",
    sport_in_use:
      "Hay instalaciones o clubes con este deporte: no se puede eliminar, pero sí ocultar.",
    unsupported_photo: "La foto debe ser una imagen PNG, JPEG o WebP.",
    photo_too_large: "La foto no puede superar los 4 MB.",
    photo_limit: "Cada instalación puede tener hasta 10 fotos.",
    slug_taken: "Ya existe un ayuntamiento con ese identificador.",
    category_not_enabled: "El ayuntamiento no ofrece esta categoría.",
    category_already_requested:
      "Ya solicitaste esta categoría o ya la tienes verificada.",
    booking_blocked:
      "No puedes hacer reservas temporalmente por acumular ausencias sin avisar.",
    attendance_window:
      "Solo se puede marcar como no presentada una reserva ya empezada y en el mismo día.",
    rate_limited:
      "Demasiadas solicitudes. Espera un minuto e inténtalo de nuevo.",
    unsubscribe_stale:
      "Este enlace ya no sirve: cambiaste los avisos después de recibirlo. Gestiónalos en Cuenta y privacidad.",
    push_unavailable:
      "Este ayuntamiento no tiene activados los avisos en el dispositivo.",
    invalid_analytics:
      "Indica la dirección https de tu Umami y el identificador del sitio, o deja los dos vacíos.",
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
