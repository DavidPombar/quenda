# Kit ENS básico (borrador técnico)

> **Borrador técnico para revisión.** Lo ha redactado el equipo de desarrollo para que lo
> revise una persona con experiencia en el Esquema Nacional de Seguridad antes de usarlo.
> No es una declaración de conformidad ni una certificación, y Quenda no afirma cumplir el
> ENS: el cumplimiento es de **cada sistema en explotación**, bajo la responsabilidad del
> concello o de la deputación que lo opera.

El Real Decreto 311/2022 (ENS) se aplica a los sistemas de información de las
entidades locales. Quenda trata datos personales corrientes (nombre, correo, reservas y,
opcionalmente, NIF cifrado) para un servicio público no crítico, así que el punto de
partida razonable es la **categoría BÁSICA**. Así lo recoge la
[investigación](../../investigacion/04-stack-tecnico.md); la categoría la decide el
responsable con el análisis de riesgos.

En categoría básica, la conformidad se acredita con una **autoevaluación** y una
**Declaración de Conformidad** publicada en la sede electrónica, según la guía
**CCN-STIC 809** (su anexo A trae el modelo y el distintivo). Una auditoría formal es
voluntaria.

## Contenido

| Documento                                                          | Qué es                                                                                             | Quién lo completa                                     |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [Análisis de riesgos resumido](analisis-riesgos.md)                | Activos, valoración, amenazas y salvaguardas                                                       | Responsable de seguridad, con este borrador como base |
| [Declaración de aplicabilidad](declaracion-aplicabilidad.md)       | Medidas del anexo II para categoría básica: si aplican y quién las cubre (producto u organización) | Responsable de seguridad                              |
| [Modelo de declaración de conformidad](declaracion-conformidad.md) | Texto para la sede electrónica tras la autoevaluación                                              | Responsable del sistema                               |

## Modelo «deputación como hub»

Cuando una deputación opera una instancia para varios concellos
([despliegue en deputación](../despliegue-deputacion.md)), la mayoría de las medidas
técnicas y de operación las cubre la deputación una sola vez, y cada concello cubre las
suyas: política, roles, formación de su personal y su autoevaluación. Es el reparto que
proponen los perfiles de cumplimiento específicos del CCN para entidades locales.

**Por confirmar con la persona revisora:**

- el issue #27 pide alinear el kit con el perfil «CCN-STIC 883D». No hemos encontrado
  publicada esa denominación exacta. Lo que sí aparece en fuentes públicas es:
  - la serie CCN-STIC 883, perfil de cumplimiento para entidades locales (PCE-EELL);
  - el perfil de requisitos esenciales (PCE-RES, CCN-STIC 890A), indicado para
    diputaciones y municipios de menos de 20.000 habitantes.

  Hay que confirmar el perfil vigente en el catálogo del CCN (<https://www.ccn-cert.cni.es/>);

- la Deputación da Coruña tiene su plataforma certificada hasta 2028
  ([investigación](../../investigacion/00-resumen-ejecutivo.md)). Si Quenda se aloja en
  esa plataforma, las medidas de infraestructura se heredan de su certificación.

## Qué aporta Quenda como producto

Las medidas que el software cubre por sí mismo, con su referencia en el repositorio:

- **Cifrado en tránsito:** TLS obligatorio, HSTS y cookies `Secure` (`deploy/Caddyfile`,
  README «Demo vs production»).
- **Cabeceras de seguridad:** CSP, `X-Frame-Options` y `nosniff`, comprobadas con
  `npm run test:headers`.
- **Control de acceso por roles y aislamiento por concello:** el ámbito sale de la sesión
  autenticada, nunca de la petición ([arquitectura](../../architecture/implementation.md)).
- **Autenticación:** la ciudadanía, por un proveedor de identidad (Cl@ve vía OIDC) o por
  código de un solo uso por correo; el personal, con cuenta local, contraseña y segundo
  factor TOTP, con límite de intentos y bloqueo ([identidad](../../architecture/identity.md)).
- **Límites de peticiones** por IP en las entradas y en la API.
- **Registro de auditoría** de los cambios de gestión y de operación, consultable en el
  backoffice.
- **Cifrado de datos sensibles en reposo:** NIF cifrado con AES y claves de firma QR
  selladas ([protección de datos](../../architecture/data-protection.md)).
- **Conservación y supresión** según el plazo de cada concello, aplicada a diario.
- **Copias cifradas, podadas y verificadas** cada noche ([copias](../copias-de-seguridad.md)).
- **Software libre, dependencias con licencias revisadas** (`npm run licenses`) y
  auditoría de vulnerabilidades en la integración continua.

Lo que **no** cubre y debe aportar la organización: política de seguridad, roles y
nombramientos, formación, gestión de incidentes, seguridad física del CPD, bastionado del
servidor, segundo factor para el acceso al servidor y revisión periódica.
