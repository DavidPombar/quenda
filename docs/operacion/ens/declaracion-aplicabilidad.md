# Declaración de aplicabilidad, categoría BÁSICA (borrador)

> Borrador técnico ([kit ENS](README.md)). Recoge las medidas del anexo II del RD 311/2022
> agrupadas por familia. **Debe contrastarse con el anexo II vigente y con la guía
> CCN-STIC 804**: la persona revisora confirma la lista de medidas exigidas en categoría
> básica, sus refuerzos y su redacción. Columna _Cubre_: **P** = el producto Quenda,
> **O** = la organización que opera el sistema, **P+O** = las dos.

## Marco organizativo (org)

| Medida                            | Aplica | Cubre | Cómo                                                                                 |
| --------------------------------- | ------ | ----- | ------------------------------------------------------------------------------------ |
| org.1 Política de seguridad       | Sí     | O     | Política del concello o adhesión a la de la deputación                               |
| org.2 Normativa de seguridad      | Sí     | O     | Normas de uso para el personal gestor y técnico                                      |
| org.3 Procedimientos de seguridad | Sí     | P+O   | Procedimientos de [operación](../README.md): despliegue, copias, actualización, alta |
| org.4 Proceso de autorización     | Sí     | O     | Quién autoriza altas de gestores y cambios en el servidor                            |

## Marco operacional (op)

| Medida                                                            | Aplica                   | Cubre | Cómo                                                                                                               |
| ----------------------------------------------------------------- | ------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------ |
| op.pl.1 Análisis de riesgos                                       | Sí                       | O     | [Análisis de riesgos](analisis-riesgos.md)                                                                         |
| op.pl.2 Arquitectura de seguridad                                 | Sí                       | P+O   | Servicios y flujos en [operación](../README.md#qué-se-instala); la base no publica puertos                         |
| op.pl.3 Adquisición de nuevos componentes                         | Sí                       | P+O   | Solo dependencias libres revisadas (`npm run licenses`)                                                            |
| op.pl.4 Dimensionamiento                                          | Sí                       | O     | [Requisitos del servidor](../README.md#requisitos-del-servidor)                                                    |
| op.acc.1 Identificación                                           | Sí                       | P     | Cuentas individuales por persona; sin cuentas compartidas                                                          |
| op.acc.2 Requisitos de acceso                                     | Sí                       | P     | Permisos por rol (ciudadanía, gestor, puerta) y por concello                                                       |
| op.acc.3 Segregación de funciones                                 | Sí                       | P+O   | Roles separados en Quenda; la operación del servidor, aparte                                                       |
| op.acc.4 Gestión de derechos de acceso                            | Sí                       | P+O   | Mínimo privilegio por rol; altas de gestores registradas en la auditoría                                           |
| op.acc.5 Mecanismo de autenticación (usuarios externos)           | Sí                       | P     | Cl@ve vía OIDC o código de un solo uso con límite de intentos                                                      |
| op.acc.6 Mecanismo de autenticación (usuarios de la organización) | Sí                       | P+O   | Igual para el personal gestor; segundo factor para SSH y paneles a cargo de la organización                        |
| op.exp.1 Inventario de activos                                    | Sí                       | O     | Activos del [análisis de riesgos](analisis-riesgos.md#1-activos)                                                   |
| op.exp.2 Configuración de seguridad                               | Sí                       | P+O   | Producción sin cuentas de demostración (`DEMO_MODE=false`), cookies `Secure`, cabeceras de seguridad               |
| op.exp.3 Gestión de la configuración de seguridad                 | Sí                       | P+O   | Configuración en `deploy/`, versionada; secretos fuera del repositorio                                             |
| op.exp.4 Mantenimiento y actualizaciones de seguridad             | Sí                       | P+O   | Versiones publicadas y procedimiento de [actualización](../actualizacion.md)                                       |
| op.exp.5 Gestión de cambios                                       | Sí                       | O     | Actualizaciones planificadas con copia previa y vuelta atrás                                                       |
| op.exp.6 Protección frente a código dañino                        | Sí                       | O     | Antimalware y bastionado del servidor según la política de la organización                                         |
| op.exp.7 Gestión de incidentes                                    | Sí                       | O     | Procedimiento propio; fallos del software por [soporte](../soporte.md) y [SECURITY.md](../../../SECURITY.md)       |
| op.exp.8 Registro de la actividad                                 | Sí                       | P+O   | Auditoría de gestión y de operación en la base; registros de los contenedores                                      |
| op.exp.10 Protección de claves criptográficas                     | Sí                       | P+O   | Claves QR y NIF selladas o cifradas con secretos fuera de la base; custodia de secretos a cargo de la organización |
| op.ext.1–2 Servicios externos                                     | Según caso               | O     | Proveedor de hosting, relé SMTP y almacenamiento de copias, con contrato y nivel de servicio                       |
| op.cont Continuidad del servicio                                  | No en básica (confirmar) | O     | Aun así: reconstrucción desde copias documentada                                                                   |
| op.mon.1 Detección de intrusión                                   | Sí                       | O     | Supervisión de la organización                                                                                     |
| op.mon.2 Sistema de métricas                                      | Sí                       | O     | Disponibilidad de `/v2/public/municipalities` vigilada desde fuera                                                 |

## Medidas de protección (mp)

| Medida                                                    | Aplica     | Cubre | Cómo                                                                                                                                         |
| --------------------------------------------------------- | ---------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| mp.if Instalaciones e infraestructuras                    | Sí         | O     | CPD del concello, de la deputación o proveedor con certificación ENS                                                                         |
| mp.per Gestión del personal                               | Sí         | O     | Deberes, formación y concienciación ([plan de implantación](../plan-implantacion.md), semanas 5–6)                                           |
| mp.eq.1 Puesto de trabajo despejado                       | Sí         | O     | —                                                                                                                                            |
| mp.eq.2 Bloqueo del puesto de trabajo                     | Sí         | O     | —                                                                                                                                            |
| mp.eq.3 Protección de dispositivos portátiles             | Sí         | O     | Incluye las tabletas de la puerta, que guardan el día de accesos                                                                             |
| mp.com.1 Perímetro seguro                                 | Sí         | P+O   | Solo 80 y 443 abiertos; la base y la API sin puertos publicados                                                                              |
| mp.com.2 Protección de la confidencialidad                | Sí         | P     | TLS en todo el tráfico y HSTS                                                                                                                |
| mp.com.3 Protección de la integridad y de la autenticidad | Sí         | P     | TLS; pases QR firmados con la clave de cada concello                                                                                         |
| mp.si Soportes de información                             | Sí         | P+O   | Copias cifradas con restic; borrado seguro de discos a cargo de la organización                                                              |
| mp.sw.1 Desarrollo de aplicaciones                        | Sí         | P     | Código público, revisión por PR, pruebas automáticas y de accesibilidad                                                                      |
| mp.sw.2 Aceptación y puesta en servicio                   | Sí         | P+O   | Comprobaciones de la [guía de despliegue](../despliegue-concello.md#5-comprobar)                                                             |
| mp.info.1 Datos personales                                | Sí         | P+O   | Minimización, consentimiento versionado, exportación y supresión de la cuenta ([protección de datos](../../architecture/data-protection.md)) |
| mp.info.2 Calificación de la información                  | Sí         | O     | —                                                                                                                                            |
| mp.info.3 Firma electrónica                               | Según caso | —     | Quenda no firma documentos                                                                                                                   |
| mp.info.4 Sellos de tiempo                                | No         | —     | —                                                                                                                                            |
| mp.info.5 Limpieza de documentos                          | Sí         | P+O   | Las exportaciones no incluyen metadatos ocultos; revisión de la organización                                                                 |
| mp.info.6 Copias de seguridad                             | Sí         | P+O   | Copia diaria cifrada, verificada, y simulacro trimestral ([copias](../copias-de-seguridad.md))                                               |
| mp.s.1 Protección del correo electrónico                  | Sí         | O     | Relé SMTP de la organización                                                                                                                 |
| mp.s.2 Protección de servicios y aplicaciones web         | Sí         | P     | CSP, cabeceras, protección CSRF con cabecera propia, validación de entradas, límites por IP                                                  |
| mp.s.3 Protección de la navegación web                    | Sí         | O     | Puestos de la organización                                                                                                                   |
| mp.s.4 Protección frente a la denegación de servicio      | Sí         | P+O   | Límites por IP en la API; protección de red del proveedor                                                                                    |
