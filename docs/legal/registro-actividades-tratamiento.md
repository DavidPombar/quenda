# Registro de actividades de tratamiento — Reserva de instalaciones deportivas municipales

> **Plantilla orientativa.** Sustituye los campos `{{…}}` y revísala con la persona delegada de
> protección de datos (DPD) del concello antes de publicarla. No es asesoramiento jurídico. Puede
> traducirse al gallego para su publicación. La descripción técnica de cada dato está en
> [`docs/architecture/data-protection.md`](../architecture/data-protection.md).
>
> Base normativa: art. 30 del Reglamento (UE) 2016/679 (RGPD) y art. 31 de la Ley Orgánica 3/2018
> (LOPDGDD), que obliga a las administraciones públicas a publicar su inventario de actividades.

## 1. Identificación de la actividad

| Campo | Contenido |
|---|---|
| Nombre de la actividad | Gestión y reserva de instalaciones deportivas municipales |
| Sistema | Quenda, plataforma de software libre (AGPL-3.0-or-later) |
| Fecha de alta en el registro | `{{FECHA}}` |
| Última revisión | `{{FECHA}}` |

## 2. Responsable del tratamiento

| Campo | Contenido |
|---|---|
| Responsable | `{{CONCELLO}}` |
| NIF | `{{NIF}}` |
| Dirección | `{{DIRECCIÓN}}` |
| Contacto | `{{CORREO DE DEPORTES}}` |
| Delegado/a de protección de datos | `{{NOMBRE O CARGO}}` — `{{CORREO DPD}}` |

## 3. Encargado del tratamiento

Rellenar solo si la plataforma la opera otra entidad (deputación, mancomunidade u operador
privado). Si el concello la aloja por sí mismo, indicar «No hay encargado».

| Campo | Contenido |
|---|---|
| Encargado | `{{ENTIDAD OPERADORA}}` |
| Contrato o convenio (art. 28 RGPD) | `{{REFERENCIA}}` — modelo en [`contrato-encargado-tratamiento.md`](contrato-encargado-tratamiento.md) |
| Subencargados autorizados | `{{ALOJAMIENTO, COPIAS DE SEGURIDAD}}` |

## 4. Finalidades

- Permitir que la ciudadanía consulte la disponibilidad de las instalaciones y reserve, cambie o
  cancele turnos.
- Mantener el historial de reservas de cada persona y los avisos asociados.
- Gestionar las instalaciones, sus horarios y normas de uso.
- Obtener indicadores agregados de ocupación para la planificación municipal.
- Dejar constancia de los cambios realizados (registro de auditoría) para la rendición de cuentas.

## 5. Base jurídica

- **Art. 6.1.e RGPD:** cumplimiento de una misión realizada en interés público o en el ejercicio de
  poderes públicos, en relación con la competencia municipal en promoción del deporte e
  instalaciones deportivas (art. 25.2.l de la Ley 7/1985, reguladora de las bases del régimen
  local) y con la ordenanza o reglamento de uso de instalaciones `{{REFERENCIA}}`.
- Si la instalación cobra un precio público: art. 6.1.c RGPD en relación con la ordenanza fiscal
  `{{REFERENCIA}}`. Eliminar esta línea si no procede.

La aceptación del aviso de privacidad que pide la aplicación al entrar acredita que la persona fue
informada (art. 13 RGPD); no es la base jurídica del tratamiento.

## 6. Categorías de personas interesadas

- Personas usuarias que reservan instalaciones.
- Personal municipal que gestiona las instalaciones.

`{{Si se admiten reservas de menores, describir cómo se gestiona su representación.}}`

## 7. Categorías de datos personales

| Categoría | Datos |
|---|---|
| Identificativos | Nombre visible facilitado por el sistema de identificación; identificador interno |
| Uso del servicio | Reservas (instalación, fecha y hora, estado), avisos, versión del aviso de privacidad aceptada y fecha |
| Seguridad | Sesiones (identificador cifrado y caducidad); registro de auditoría de las acciones |

No se tratan categorías especiales de datos (art. 9 RGPD), documentos de identidad, direcciones,
teléfonos ni datos bancarios. `{{Añadir los datos que aporte el sistema de identificación en
producción, por ejemplo el identificador de Cl@ve o Chave365.}}`

## 8. Destinatarios

- Personal del servicio municipal de deportes con perfil de gestión, limitado a su concello.
- Encargado del tratamiento indicado en el apartado 3, solo para prestar el servicio.
- No se prevén cesiones a terceros salvo obligación legal.

## 9. Transferencias internacionales

No se realizan. `{{Confirmar que el alojamiento está en el Espacio Económico Europeo.}}`

## 10. Plazos de conservación

- Los datos se conservan mientras la cuenta esté activa.
- Las reservas terminadas, los avisos y la autoría de los registros de auditoría se desvinculan de
  la persona transcurridos **`{{N}}` meses** (parámetro `retention_months` del concello).
- Si la persona elimina su cuenta, se anonimiza de inmediato: se cancelan sus reservas futuras, se
  borran sus avisos y sesiones y se sustituye su nombre. Sus constancias de aceptación del aviso se
  borran al cumplirse el plazo anterior.
- `{{Indicar plazos superiores exigidos por otras normas, por ejemplo de contabilidad o archivo.}}`

## 11. Derechos de las personas interesadas

- **Acceso y portabilidad:** desde «A miña conta», descarga de un fichero con todos sus datos.
- **Supresión:** desde «A miña conta», eliminación de la cuenta.
- **Rectificación, limitación y oposición:** mediante solicitud a `{{CANAL}}`.
- Derecho a reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).

## 12. Medidas de seguridad

Las previstas en el Esquema Nacional de Seguridad (Real Decreto 311/2022) para la categoría
`{{BÁSICA / MEDIA}}` del sistema, según la disposición adicional primera de la LOPDGDD. Entre las
medidas técnicas de la plataforma: separación de los datos de cada concello, sesiones con
identificadores aleatorios almacenados cifrados, registro de auditoría de las acciones, ausencia de
servicios de terceros que reciban datos personales y software libre auditable. Detalle en
[`docs/architecture/data-protection.md`](../architecture/data-protection.md).
