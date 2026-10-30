# Análisis de riesgos resumido (borrador)

> Borrador técnico ([kit ENS](README.md)). Lo debe revisar y aprobar el responsable de
> seguridad del concello o de la deputación con una metodología reconocida (por ejemplo
> MAGERIT y la herramienta PILAR del CCN). Las valoraciones son una propuesta de partida.

**Sistema:** Quenda, reserva de instalaciones deportivas municipales.
**Responsable de la información y del servicio:** [concello].
**Operador del sistema:** [concello o deputación].
**Fecha y versión:** [completar].

## 1. Activos

| Activo                               | Descripción                                                                                                | Dónde está                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **I1. Datos de la ciudadanía**       | Nombre, correo, reservas, avisos, consentimientos; NIF cifrado si el concello comprueba el empadronamiento | PostgreSQL                                                   |
| **I2. Datos de gestión**             | Instalaciones, horarios, normas, tarifas, temporadas de clubes, textos legales                             | PostgreSQL                                                   |
| **I3. Registro de auditoría**        | Cambios de gestión y de operación                                                                          | PostgreSQL                                                   |
| **S1. Servicio de reserva en línea** | Web pública, app ciudadana y backoffice                                                                    | Contenedores `web`, `api` y `worker`                         |
| **S2. Avisos**                       | Correos y Web Push de confirmación, recordatorio y cambio                                                  | `worker` y servidor SMTP                                     |
| **K1. Secretos**                     | `ACCESS_KEY_SECRET`, `QUENDA_DATA_KEY`, VAPID, contraseñas de base de datos y de copias                    | `deploy/.env`, `deploy/quenda.env` y almacén de credenciales |
| **B1. Copias**                       | Volcados cifrados con restic                                                                               | Repositorio de copias                                        |
| **H1. Infraestructura**              | Servidor, red, DNS y certificado                                                                           | CPD o proveedor                                              |

## 2. Valoración (categoría)

Dimensiones del anexo I del RD 311/2022: confidencialidad [C], integridad [I], trazabilidad
[T], autenticidad [A] y disponibilidad [D].

| Activo | C    | I    | T    | A    | D    | Motivo                                                                                               |
| ------ | ---- | ---- | ---- | ---- | ---- | ---------------------------------------------------------------------------------------------------- |
| I1     | Bajo | Bajo | Bajo | Bajo | —    | Datos personales corrientes, sin categorías especiales; una filtración tendría un perjuicio limitado |
| I2     | —    | Bajo | Bajo | Bajo | —    | Información pública en su mayoría                                                                    |
| I3     | Bajo | Bajo | Bajo | —    | —    | Necesario para rendir cuentas                                                                        |
| S1     | —    | —    | —    | Bajo | Bajo | Una caída de horas se suple con el teléfono y el mostrador                                           |
| S2     | —    | —    | —    | —    | Bajo | Un aviso tardío no impide usar la instalación                                                        |

**Categoría propuesta del sistema: BÁSICA.** Revisar si el concello trata datos de
menores de forma significativa (escuelas deportivas) o si la caída del servicio en
temporada tendría un impacto mayor: cualquiera de los dos puede subir alguna dimensión a
nivel medio.

## 3. Amenazas principales y salvaguardas

| Amenaza                                          | Activos    | Salvaguardas                                                                                                                                      | Riesgo residual                                                                |
| ------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Acceso no autorizado a cuentas de la ciudadanía  | I1         | Entrada por Cl@ve o por código de un solo uso con límite de intentos y de envíos; sesiones que caducan y se purgan; cookies `Secure` y `HttpOnly` | Bajo                                                                           |
| Un gestor accede a datos de otro concello        | I1, I2     | El ámbito de cada operación sale de la sesión; pruebas automáticas de aislamiento                                                                 | Bajo                                                                           |
| Robo de la sesión de un gestor                   | I1, I2     | TLS y HSTS, CSP, cookies `Secure`, auditoría de cada cambio                                                                                       | Medio-bajo: el personal no tiene segundo factor hasta que entre por Cl@ve (#8) |
| Fuerza bruta o abuso automatizado                | S1         | Límites por IP en la API y en las entradas                                                                                                        | Bajo                                                                           |
| Vulnerabilidad en una dependencia                | S1, I1     | Dependencias libres revisadas, `npm audit` en la integración continua, imágenes con versiones fijas y actualizaciones documentadas                | Medio-bajo: depende de actualizar a tiempo                                     |
| Pérdida o corrupción de datos                    | I1, I2, I3 | Copia cifrada diaria fuera del servidor, `restic check`, simulacro trimestral                                                                     | Bajo                                                                           |
| Pérdida de un secreto                            | K1         | Copia de los secretos fuera del servidor; claves QR rotables desde el backoffice                                                                  | Bajo                                                                           |
| Caída del servidor                               | S1, S2     | Reinicio automático de los servicios; reconstrucción documentada desde las copias; el mostrador sigue atendiendo                                  | Bajo                                                                           |
| Error del personal (borrados, cierres por error) | I2         | Las instalaciones se cierran en vez de borrarse; las cancelaciones avisan y quedan en la auditoría                                                | Bajo                                                                           |
| Filtración por terceros (mapas, analítica)       | I1         | Teselas configurables a un servidor propio; analítica autoalojada, sin cookies y opcional                                                         | Bajo                                                                           |
| Correo suplantado o interceptado                 | S2         | Envío por el relé del concello o de la deputación con TLS; los correos no llevan datos sensibles                                                  | Bajo                                                                           |

## 4. Medidas pendientes de la organización

1. Política de seguridad y nombramientos (o adhesión a la de la deputación).
2. Segundo factor para el acceso SSH y para el panel de Coolify, si se usa.
3. Bastionado del sistema operativo y actualizaciones automáticas de seguridad.
4. Procedimiento de gestión de incidentes y notificación (al CCN-CERT y a la AEPD si hay
   datos personales afectados).
5. Registro de los simulacros de restauración.
6. Revisión de este análisis al menos una vez al año o cuando cambie el sistema.
