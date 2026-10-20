# Contrato de encargo del tratamiento — Plataforma Quenda

> **Plantilla orientativa.** Pensada para cuando una entidad (deputación, mancomunidade, AMTEGA u
> operador privado) aloja y opera Quenda por cuenta de uno o varios concellos. Sustituye los campos
> `{{…}}`, adáptala al instrumento jurídico que corresponda (convenio, encomienda, contrato público)
> y revísala con la persona delegada de protección de datos y los servicios jurídicos. No es
> asesoramiento jurídico. Puede traducirse al gallego.
>
> Base normativa: art. 28 del Reglamento (UE) 2016/679 (RGPD), art. 33 de la Ley Orgánica 3/2018
> (LOPDGDD) y Real Decreto 311/2022 (Esquema Nacional de Seguridad).

## Partes

- **Responsable del tratamiento:** `{{CONCELLO}}`, NIF `{{NIF}}`, con domicilio en `{{DIRECCIÓN}}`,
  representado por `{{NOMBRE Y CARGO}}`.
- **Encargado del tratamiento:** `{{ENTIDAD OPERADORA}}`, NIF `{{NIF}}`, con domicilio en
  `{{DIRECCIÓN}}`, representado por `{{NOMBRE Y CARGO}}`.

## Cláusula 1. Objeto

El encargado tratará, por cuenta del responsable, los datos personales necesarios para prestar el
servicio de reserva y gestión de instalaciones deportivas municipales mediante la plataforma Quenda:
alojamiento, operación, mantenimiento, copias de seguridad y soporte técnico.

## Cláusula 2. Duración

Este encargo tiene la misma duración que `{{CONVENIO O CONTRATO PRINCIPAL}}`, desde `{{FECHA}}`
hasta `{{FECHA}}`. Al terminar se aplica la cláusula 11.

## Cláusula 3. Naturaleza, finalidad y datos

| Elemento | Descripción |
|---|---|
| Operaciones | Recogida, registro, conservación, consulta, modificación, anonimización y supresión, todas ellas automatizadas por la plataforma |
| Finalidad | La descrita en el registro de actividades de tratamiento del responsable ([`registro-actividades-tratamiento.md`](registro-actividades-tratamiento.md)) |
| Personas interesadas | Personas usuarias de las instalaciones y personal municipal de gestión |
| Datos | Nombre visible, identificador interno, reservas, avisos, versión del aviso de privacidad aceptada, sesiones y registro de auditoría |
| Categorías especiales | No se tratan |

## Cláusula 4. Instrucciones

1. El encargado tratará los datos únicamente siguiendo las instrucciones documentadas del
   responsable, que incluyen este contrato y la configuración del concello en la plataforma (plazo
   de conservación `retention_months`, versión del aviso de privacidad y normas de uso).
2. Si el encargado considera que una instrucción infringe la normativa de protección de datos,
   informará inmediatamente al responsable.
3. El encargado no usará los datos para fines propios ni los cederá a terceros, salvo obligación
   legal comunicada previamente al responsable.

## Cláusula 5. Confidencialidad

El encargado garantiza que las personas autorizadas para tratar los datos se han comprometido a
respetar su confidencialidad o están sujetas a una obligación legal de confidencialidad, también
después de terminar su relación con el encargado.

## Cláusula 6. Medidas de seguridad

1. El encargado aplicará las medidas del Esquema Nacional de Seguridad correspondientes a la
   categoría `{{BÁSICA / MEDIA}}` del sistema y las del art. 32 RGPD, incluyendo como mínimo:
   - separación de los datos de cada concello y acceso del personal municipal limitado al suyo;
   - cifrado de las comunicaciones (HTTPS) y de las copias de seguridad;
   - copias de seguridad `{{PERIODICIDAD}}` con pruebas de restauración `{{PERIODICIDAD}}`;
   - ejecución programada de la tarea de retención de la plataforma, al menos `{{PERIODICIDAD}}`;
   - registro y conservación del registro de auditoría de la plataforma;
   - actualización de la plataforma y sus dependencias ante vulnerabilidades conocidas.
2. El encargado facilitará al responsable, cuando lo solicite, la declaración o certificación de
   conformidad con el ENS del servicio.

## Cláusula 7. Subencargados

1. Se autorizan los siguientes subencargados: `{{PROVEEDOR DE ALOJAMIENTO}}` (alojamiento) y
   `{{PROVEEDOR DE COPIAS}}` (copias de seguridad), ambos con tratamiento dentro del Espacio
   Económico Europeo.
2. El encargado comunicará con `{{N}}` días de antelación cualquier cambio de subencargado, y el
   responsable podrá oponerse.
3. El encargado impondrá a cada subencargado las mismas obligaciones de este contrato y responderá
   ante el responsable de su cumplimiento.

## Cláusula 8. Derechos de las personas interesadas

1. La plataforma permite a cada persona descargar sus datos y eliminar su cuenta sin intervención
   del encargado. El encargado mantendrá estas funciones operativas.
2. Si el encargado recibe directamente una solicitud de ejercicio de derechos, la remitirá al
   responsable en un plazo máximo de `{{N}}` días hábiles y le prestará la asistencia técnica
   necesaria para atenderla.

## Cláusula 9. Violaciones de seguridad

1. El encargado notificará al responsable, sin dilación indebida y en un plazo máximo de
   `{{N}}` horas desde que tenga conocimiento, cualquier violación de la seguridad de los datos.
2. La notificación incluirá, como mínimo, la información del art. 33.3 RGPD que esté disponible.
3. El encargado colaborará con el responsable en la notificación a la autoridad de control y, en su
   caso, a las personas afectadas, y en la aplicación de medidas correctoras.

## Cláusula 10. Asistencia al responsable

El encargado asistirá al responsable en las evaluaciones de impacto y consultas previas
(arts. 35 y 36 RGPD) y le facilitará la información necesaria para demostrar el cumplimiento de sus
obligaciones, incluidas auditorías o inspecciones del responsable o de quien este designe.

## Cláusula 11. Fin del encargo

Al terminar el encargo, y según indique el responsable, el encargado:

1. le entregará los datos del concello en un formato abierto y documentado que permita cargarlos
   en otra instancia, y/o
2. los suprimirá de sus sistemas y copias de seguridad en un plazo de `{{N}}` días, certificándolo
   por escrito,

salvo que una norma exija su conservación, en cuyo caso los mantendrá bloqueados durante el plazo
legal.

## Cláusula 12. Responsabilidad

Si el encargado destina los datos a otra finalidad, los comunica o los utiliza incumpliendo este
contrato, será considerado responsable del tratamiento a esos efectos y responderá de las
infracciones en que haya incurrido personalmente (art. 28.10 RGPD).

## Firma

En `{{LUGAR}}`, a `{{FECHA}}`.

| Por el responsable | Por el encargado |
|---|---|
| `{{NOMBRE Y CARGO}}` | `{{NOMBRE Y CARGO}}` |
